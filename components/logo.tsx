import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo-wrap" aria-label="Olgunsoy Havluculuk ana sayfa">
      <Image
        src="/logo.jpg"
        alt="Olgunsoy Havluculuk logosu"
        width={46}
        height={46}
        priority
      />
      <div>
        <p className="logo-title">Olgunsoy</p>
        <p className="logo-sub">Havluculuk</p>
      </div>
    </Link>
  );
}
