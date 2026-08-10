import type {MetaFunction} from 'react-router';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';

export const meta: MetaFunction = () => [
  {title: '404 Not Found — LEGENDARY BRANDING'},
];

export async function loader() {
  throw new Response('Not Found', {status: 404});
}

export function ErrorBoundary() {
  return (
    <Container className="py-32 text-center">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-4">
        404
      </p>
      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
        Page Not Found
      </h1>
      <p className="text-sm text-[#6b6b6b] max-w-sm mx-auto leading-relaxed mb-10">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button as="link" to="/" variant="solid">
          Back to Home
        </Button>
        <Button as="link" to="/collections/all-products" variant="outline">
          Shop New Drops
        </Button>
      </div>
    </Container>
  );
}

export default function CatchAll() {
  return null;
}
