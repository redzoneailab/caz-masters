import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <p className="text-white font-black text-lg uppercase tracking-wider">The Caz Masters</p>
            <p className="text-sm mt-1">Cazenovia Golf Club &middot; Friday, July 3rd</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex flex-col gap-2 text-sm font-medium">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/info" className="hover:text-white transition-colors">Information</Link>
              <Link href="/register" className="hover:text-gold-400 transition-colors">Register</Link>
            </div>
            <div className="flex flex-col gap-2 text-sm font-medium">
              <Link href="/store" className="hover:text-gold-400 transition-colors">Store</Link>
              <Link href="/afterparty" className="hover:text-white transition-colors">After Party</Link>
            </div>
            <div className="flex flex-col gap-2 text-sm font-medium">
              <Link href="/history" className="hover:text-white transition-colors">Hall of Fame</Link>
              <Link href="/gallery" className="hover:text-white transition-colors">Gallery</Link>
              <Link href="/stats" className="hover:text-white transition-colors">Stats</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-navy-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <p>&copy; {new Date().getFullYear()} The Caz Masters</p>
          <p className="text-navy-600 uppercase tracking-[0.2em] font-bold text-xs">
            Brought to You by The Dog
          </p>
        </div>
      </div>
    </footer>
  );
}
