import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, ChevronRight } from 'lucide-react';

interface DocFile {
  id: string;
  title: string;
  filename: string;
  description: string;
  order: number;
}

// Documentation files configuration
const docFiles: DocFile[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    filename: 'getting-started.md',
    description:
      'Learn the basics of using the Noreaster FRC tournament management system',
    order: 1,
  },
  {
    id: 'teams',
    title: 'Teams Management',
    filename: 'teams.md',
    description: 'How to view, add, and manage teams in the tournament',
    order: 2,
  },
  {
    id: 'alliances',
    title: 'Alliances',
    filename: 'alliances.md',
    description: 'Understanding and managing tournament alliances',
    order: 3,
  },
  {
    id: 'matches',
    title: 'Matches',
    filename: 'matches.md',
    description: 'Viewing match results and managing match data',
    order: 4,
  },
  {
    id: 'schedule',
    title: 'Schedule',
    filename: 'schedule.md',
    description: 'Creating and managing tournament schedules',
    order: 5,
  },
  {
    id: 'rankings',
    title: 'Rankings',
    filename: 'rankings.md',
    description: 'Understanding team rankings and statistics',
    order: 6,
  },
  {
    id: 'live-tournament',
    title: 'Live Tournament',
    filename: 'live-tournament.md',
    description: 'Real-time tournament updates and live scoring',
    order: 7,
  },
];

export default function Docs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDoc, setSelectedDoc] = useState<string>('getting-started');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Get the current document from URL params
  const currentDoc = searchParams.get('doc') || 'getting-started';

  useEffect(() => {
    setSelectedDoc(currentDoc);
  }, [currentDoc]);

  useEffect(() => {
    const loadMarkdown = async () => {
      setLoading(true);
      try {
        const docFile = docFiles.find(doc => doc.id === selectedDoc);
        if (docFile) {
          const response = await fetch(
            `${import.meta.env.BASE_URL}docs/${docFile.filename}`
          );

          if (response.ok) {
            const content = await response.text();
            setMarkdownContent(content);
          } else {
            setMarkdownContent(
              `# ${docFile.title}\n\n*Documentation coming soon...*`
            );
          }
        }
      } catch (error) {
        console.error('Error loading markdown:', error);
        setMarkdownContent('# Error\n\nFailed to load documentation.');
      } finally {
        setLoading(false);
      }
    };

    loadMarkdown();
  }, [selectedDoc]);

  const handleDocSelect = (docId: string) => {
    setSelectedDoc(docId);
    setSearchParams({ doc: docId });
  };

  const selectedDocInfo = docFiles.find(doc => doc.id === selectedDoc);

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar with documentation navigation */}
      <div className="w-80 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4 space-y-2">
                {docFiles.map(doc => (
                  <div
                    key={doc.id}
                    className={`w-full p-4 rounded-md cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground ${
                      selectedDoc === doc.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleDocSelect(doc.id)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {doc.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{selectedDocInfo?.title || 'Documentation'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="prose prose-sm max-w-none">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mb-4 text-foreground border-b pb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold mb-3 mt-6 text-foreground">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 text-muted-foreground leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-4 ml-4 space-y-1 text-muted-foreground">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 ml-4 space-y-1 text-muted-foreground">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="list-disc">{children}</li>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                            {children}
                          </code>
                        ) : (
                          <code className={className}>{children}</code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto mb-4">
                          <table className="min-w-full border border-border rounded-lg">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-border px-4 py-2 bg-muted font-medium text-left">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-border px-4 py-2">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {markdownContent}
                  </ReactMarkdown>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
