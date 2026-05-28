import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  // We are waiting for tables to be initialized. For now, just test auth connection.
  const { data: user } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">SignalDesk AI</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Your AI-powered customer workflow platform.
      </p>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Supabase Connection</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Supabase is successfully configured in the frontend!
        </p>
      </div>
    </div>
  )
}
