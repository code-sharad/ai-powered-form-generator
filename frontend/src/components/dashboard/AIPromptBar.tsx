'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formService } from '@/services/formService';
import toast from 'react-hot-toast';

export function AIPromptBar() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error('Please describe the form you want to create');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await formService.generateForm({ query: prompt });

      if (response.success && response.data) {
        toast.success('Form generated successfully!');
        setPrompt('');
        // Navigate to forms list or builder
        router.push('/dashboard');
      } else {
        toast.error('Failed to generate form');
      }
    } catch (error) {
      console.error('Form generation error:', error);
      toast.error('Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#000000] border-t border-[#333333] z-50">
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the form you want to create..."
            className="w-full bg-[#0a0a0a] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#444444] focus-visible:ring-0 min-h-[120px] max-h-[200px] resize-none rounded-xl pr-24 py-4 px-4 text-[14px] leading-relaxed"
            disabled={isGenerating}
          />
          <Button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="absolute right-3 bottom-3 bg-white text-black hover:bg-[#fafafa] h-10 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
