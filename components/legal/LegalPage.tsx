import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';

interface Props {
  title: string;
  body: string;
}

export default function LegalPage({ title, body }: Props) {
  return (
    <div className="container-custom max-w-4xl py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        На главную
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
        <h1 className="sr-only">{title}</h1>
        <div className="prose prose-lg max-w-none prose-headings:text-dark-900 prose-a:text-primary-600 hover:prose-a:text-primary-700 prose-strong:text-dark-900">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
