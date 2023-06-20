export const isValidEmail = (email) => {
  if (!email || !email.length) return false
  const atIndex = email.indexOf("@")
  const lastDotIndex = Math.max(...email.split("").map((char, i) => char === "." ? i : -1))
  return atIndex > -1 && lastDotIndex > atIndex && email.length > lastDotIndex
}
