import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary-600">TrustCircle</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Web3 micro-lending platform on Celo blockchain with AI-powered credit scoring
            and social lending circles
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/borrow"
              className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Borrow Now
            </Link>
            <Link
              href="/lend"
              className="px-8 py-4 bg-success-600 text-white rounded-lg font-semibold hover:bg-success-700 transition-colors"
            >
              Earn Interest
            </Link>
            <Link
              href="/circles"
              className="px-8 py-4 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Join Circles
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            title="AI Credit Scoring"
            description="Get credit scores based on on-chain behavior and social reputation"
            icon="🤖"
          />
          <FeatureCard
            title="Social Lending Circles"
            description="Join communities and vouch for each other to access better rates"
            icon="🤝"
          />
          <FeatureCard
            title="Multi-Currency"
            description="Borrow and lend in cUSD, cEUR, and cREAL stablecoins"
            icon="💰"
          />
          <FeatureCard
            title="Low Interest Rates"
            description="Competitive rates starting from 8% APY based on your credit score"
            icon="📉"
          />
          <FeatureCard
            title="Verified Users"
            description="KYC/AML verification ensures trust and regulatory compliance"
            icon="✅"
          />
          <FeatureCard
            title="Built on Celo"
            description="Fast, low-cost transactions on mobile-first blockchain"
            icon="📱"
          />
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard label="Total Value Locked" value="$0" />
            <StatCard label="Active Loans" value="0" />
            <StatCard label="Lending Circles" value="0" />
            <StatCard label="Verified Users" value="0" />
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Connect your wallet and join the financial inclusion revolution
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Launch App
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600">
          <p className="mb-2">Built on Celo 🌱 Powered by Mento Stablecoins</p>
          <p className="text-sm">
            ⚠️ TrustCircle is experimental software. Use at your own risk.
          </p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-primary-600 mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}
