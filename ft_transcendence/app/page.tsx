import prisma from "../lib/prisma"

export default async function Home() {
  let users = []

  try {
    users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch {
    return <p>Database error</p>
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <ul className="space-y-2">
        {users.map((u: any) => (
          <li key={u.id} className="border p-3 rounded">
            <p>{u.name}</p>
            <p className="text-sm text-gray-500">{u.email}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
