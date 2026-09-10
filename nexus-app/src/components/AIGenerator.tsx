'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function AIGenerator() {
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create a local URL for preview
      const objectUrl = URL.createObjectURL(file)
      setImagePreview(objectUrl)
    }
  }

  const handleGenerate = async () => {
    if (!prompt || !imageFile) {
      setError('Please provide both an image and a prompt.')
      return
    }

    setError(null)
    setIsGenerating(true)
    setResultImage(null)

    try {
      // Step 1: Convert the file to base64 to send to API
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(imageFile)
      })

      // Step 2: Call our Next.js API route
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          image: base64Image,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      setResultImage(data.imageUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-red-950/20 border border-red-500/20 p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-red-900/50 pb-2">
        <h2 className="text-lg font-bold uppercase tracking-widest text-red-400">AI Rendering Module</h2>
        <span className="text-[10px] bg-red-900/50 text-red-200 px-2 py-1 uppercase tracking-widest font-mono">Standby</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INPUT COLUMN */}
        <div className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-red-300 font-mono">Source Face (Reference)</label>
            <div className="relative w-full aspect-square border border-dashed border-red-500/30 bg-black/50 hover:bg-red-950/30 transition-colors flex items-center justify-center cursor-pointer group overflow-hidden">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="text-center font-mono text-red-500/50 group-hover:text-red-400 transition-colors">
                  <span className="block text-2xl mb-2">+</span>
                  <span className="text-xs uppercase tracking-widest">Select Image</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-red-300 font-mono">Style Override (Prompt)</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-black/50 border border-red-500/30 p-3 text-sm text-red-100 font-mono h-24 focus:outline-none focus:border-red-500 transition-colors placeholder:text-red-900/50 resize-none"
              placeholder="e.g. A cyberpunk cyborg with neon glowing eyes, unral engine 5 render, cinematic 8k, photorealistic"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 text-red-400 text-xs font-mono">
              [ERROR] {error}
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !imageFile || !prompt}
            className="w-full bg-red-600 hover:bg-red-500 text-white rounded-none uppercase tracking-widest text-xs font-bold h-12 mt-2 disabled:bg-red-900/50 disabled:text-red-300/50 transition-colors"
          >
            {isGenerating ? 'Rendering in progress...' : 'Execute AI Render'}
          </Button>
        </div>

        {/* OUTPUT COLUMN */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-red-300 font-mono">Output Buffer</label>
          <div className="relative w-full h-full min-h-[300px] border border-red-500/30 bg-black/50 flex items-center justify-center overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] uppercase tracking-widest font-mono text-red-400 animate-pulse">Processing...</span>
              </div>
            ) : resultImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resultImage} alt="Generated result" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] uppercase tracking-widest font-mono text-red-900/50 text-center px-4">
                No active render task.<br/>Awaiting input.
              </span>
            )}
            
            {/* Overlay scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
