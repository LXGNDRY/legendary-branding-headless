/**
 * Sign-out control. Logging out is a state change, so it is a POST (a plain link could be triggered by any
 * page, image or prefetch); it looks like a link where it is used.
 */
export default function LogoutForm({label, className}: {label: string; className?: string}) {
  return (
    <form method="POST" action="/account/logout" className="contents">
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
