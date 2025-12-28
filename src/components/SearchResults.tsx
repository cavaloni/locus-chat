import { ExternalLink, Globe } from 'lucide-react';
import type { SearchResult } from '@/types/conversation';

interface SearchResultsProps {
  sources: SearchResult[];
}

export function SearchResults({ sources }: SearchResultsProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
        <Globe className="h-4 w-4" />
        <span>Sources</span>
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors group"
          >
            <div className="flex items-start gap-3">
              {source.favicon ? (
                <img
                  src={source.favicon}
                  alt=""
                  className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-sm"
                />
              ) : (
                <Globe className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-400" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                    {source.title}
                  </h4>
                  <ExternalLink className="h-3 w-3 text-blue-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {source.snippet}
                </p>
                <p className="text-xs text-blue-400/60 mt-1 truncate">
                  {new URL(source.url).hostname}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
