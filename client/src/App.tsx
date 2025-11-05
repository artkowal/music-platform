import { useState, useEffect } from 'react' // <-- 1. DODANE IMPORTY
import { Button } from "@/components/ui/button"

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>("light")

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme]) 

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-8">

      <div className="absolute top-8 right-8">
        <Button variant="outline" onClick={toggleTheme}>
          Zmień motyw (teraz: {theme})
        </Button>
      </div>

      <h1 className="bg-gradient-brand bg-clip-text text-5xl font-bold text-transparent">
        Witaj na platformie!
      </h1>

      <div className="mt-12 flex flex-wrap justify-center gap-4">

        <Button>Przycisk Primary</Button>
        <Button variant="secondary">Przycisk Secondary</Button>

        <Button className="bg-success text-white hover:bg-success-light">
          Success
        </Button>
        <Button className="bg-error text-white hover:bg-error-light">
          Error
        </Button>

      </div>
    </div>
  )
}

export default App