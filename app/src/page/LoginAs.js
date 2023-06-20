import { useEffect } from "react"
import { useNavigate } from "react-router"
import { useSearchParams } from "react-router-dom"
import { decrypt } from "../func/crypto"
import Loading from "./prompts/Loading"

export default function LoginAs({ setUserId, setIsAdmin, setAsUserId, setAsName, setAccounts, setImpersonatedAccounts, setMayAddCollection }) {
    const navigate = useNavigate()
    const [qs] = useSearchParams()
    const qsKey = qs.get('key')
    const next = qs.get('next')

    useEffect(() => {
        decrypt(qsKey).then(s => {
            if (s) {
                window.qsKey = qsKey
                const { byUserId, asUserId, asName, accounts, mayAddCollection, userWalletAddress } = JSON.parse(s)
                setUserId(byUserId)
                setAsUserId(asUserId)
                setAsName(asName)
                setIsAdmin(true)
                setAccounts(accounts)
                setImpersonatedAccounts(userWalletAddress)
                setMayAddCollection(mayAddCollection)
                window.__insp?.push(['tagSession', { isAdmin: true, asUserId, asName, asWalletAddress: userWalletAddress }])
                navigate(next || "/my-collections")
            }
        })
        // eslint-disable-next-line
    }, [qsKey])

    return <Loading />
}