const functions = require("firebase-functions")
const { HttpsError } = require("firebase-functions/v1/auth")
const sql = require("mssql")
const { isValidAuthToken, parseAuthToken } = require("../crypto")
const dbCfg = functions.config().db

sql.valueHandler.set(sql.TYPES.DateTimeOffset, value => value?.toJSON())

// createTcpPool initializes a TCP connection pool for a Cloud SQL
// instance of SQL Server.
const createTcpPool = async (config) => {
	// Note: Saving credentials in environment variables is convenient, but not
	// secure - consider a more secure solution such as
	// Cloud Secret Manager (https://cloud.google.com/secret-manager) to help
	// keep secrets safe.
	const dbConfig = {
		server: dbCfg.sql_instance_host,
		port: parseInt(dbCfg.db_port),
		user: dbCfg.db_user,
		password: process.env.DB_PASS || dbCfg.db_pass,
		database: dbCfg.db_name,
		connectionTimeout: 15000,
		options: {
			trustServerCertificate: true,
		},
		// ... Specify additional properties here.
		...config,
	}
	// console.log(dbConfig)
	return await sql.connect(dbConfig)
}

let pool = null

async function getRequest() {
	if (pool === null) {
		pool = await createTcpPool()
	}
	return pool.request()
}
exports.getRequest = getRequest

async function getTransaction() {
	if (pool === null) {
		pool = await createTcpPool()
	}
	return pool.transaction()
}
exports.getTransaction = getTransaction

const dbRuntimeOptionsProd = { secrets: ["DB_PASS"], minInstances: 1, memory: '256MB', vpcConnector: dbCfg.vpcconnector, vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY", ingressSettings: "ALLOW_ALL" }
const runtimeOptions = dbCfg.runtime_env === "prod" ? dbRuntimeOptionsProd : { secrets: ["DB_PASS"], minInstances: 1, memory: '256MB' }
exports.dbRuntimeOptions = runtimeOptions
const dbWithIPFSRuntimeOptions = { secrets: ["DB_PASS", "PROJECT_SECRET"], timeoutSeconds: 540, minInstances: 1, memory: '256MB', vpcConnector: dbCfg.vpcconnector, vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY", ingressSettings: "ALLOW_ALL" }

function createHttpsFunction(fn, options = { hasPublicAccess: true, adminOnly: false, withIPFSAccess: false }) {
	const { hasPublicAccess, adminOnly, withIPFSAccess } = options
	return functions.runWith(withIPFSAccess ? dbWithIPFSRuntimeOptions : runtimeOptions).https.onCall(async ({ authToken, ...data }, context) => {
		// TODO possibly check context.auth
		const hasAccess = hasPublicAccess || (authToken && isValidAuthToken(authToken, adminOnly))
		if (!hasAccess) {
			throw new HttpsError("unauthenticated", "Request had invalid authToken")
		}
		try {
			return await fn(data, parseAuthToken(authToken))
		} catch (e) {
			console.error(e)
			return { err: { message: e.message, stack: e.stack, e } }
		}
	})
}
exports.createHttpsFunction = createHttpsFunction

async function runQuery(sql, inputs, hasManyRecordSets = false, returnFirstRecord = false, getDefaultRec = null, tran = null) {
	const sqlReq = tran ? tran.request() : await getRequest()
	Object.keys(inputs || {}).forEach(key => sqlReq.input(key, inputs[key]))
	const { recordset, recordsets } = await sqlReq.query(sql)
	return hasManyRecordSets ? recordsets : returnFirstRecord ? (recordset?.length > 0 ? recordset[0] : getDefaultRec ? await getDefaultRec() : {}) : recordset
}
exports.runQuery = runQuery

exports.getNVarcharLimits = createHttpsFunction(async (data) => {
	return await runQuery(`
	select COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH
	from information_schema.columns 
	where TABLE_NAME=@tableName and DATA_TYPE='nvarchar' and CHARACTER_MAXIMUM_LENGTH>0
	`, data)
})