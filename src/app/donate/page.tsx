import DonationForm from "./DonationForm";

export const metadata = {
  title: "Caz Cares",
  description: "Supporting our community through The Caz Masters charity golf tournament.",
};

export default function CazCaresPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">Caz Cares</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            More than a tournament. The Caz Masters is about giving back to the community
            that brings us together every summer.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-navy-900 mb-4">Our Mission</h2>
              <p className="text-navy-600 leading-relaxed mb-4">
                Since 2012, The Caz Masters has been about more than birdies and bogeys.
                Every entry fee, every donation, and every sponsorship goes directly toward
                supporting local causes in the Cazenovia community.
              </p>
              <p className="text-navy-600 leading-relaxed">
                Over 14 years, we&apos;ve raised funds for local youth sports programs,
                community development projects, and families in need. The tournament brings
                together players from across the region who share a love of golf and a
                commitment to giving back.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy-900 mb-4">Where It Goes</h2>
              <ul className="space-y-4">
                {[
                  { title: "Youth Athletics", desc: "Equipment, uniforms, and league fees for local kids" },
                  { title: "Community Programs", desc: "Supporting initiatives that strengthen Cazenovia" },
                  { title: "Families in Need", desc: "Direct support for neighbors facing hardship" },
                  { title: "Course & Club Support", desc: "Giving back to Cazenovia Golf Club" },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="w-2 h-2 rounded-full bg-gold-400 mt-2 shrink-0" />
                    <div>
                      <p className="font-semibold text-navy-900">{item.title}</p>
                      <p className="text-sm text-navy-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* In Memory */}
      <section className="py-12 bg-navy-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-3">In Loving Memory</p>
          <p className="text-navy-600 leading-relaxed">
            Each year, we play in honor of friends and family who are no longer with us
            but whose spirit lives on through this tournament. Their memory inspires us
            to come together, compete with joy, and give generously.
          </p>
          <div className="mt-6 w-16 h-px bg-gold-400 mx-auto" />
        </div>
      </section>

      {/* Donation */}
      <section className="py-16 bg-white">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-navy-900 text-center mb-2">Make a Donation</h2>
          <p className="text-center text-navy-500 mb-8">
            Support the Caz Cares mission. Every dollar makes a difference.
          </p>
          <DonationForm />
        </div>
      </section>
    </>
  );
}
