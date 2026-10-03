export default function BecuLogo({ className = '' }: { className?: string }) {
  return <img className={`becu-logo ${className}`} src="/becu/logo.png" alt="BECU" width={318} height={99} />;
}
