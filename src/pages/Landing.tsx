import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">WeighPoint</h1>
          <p className="text-xl text-base-content/70 mb-2">
            Track your weight journey with precision
          </p>
          <p className="text-base-content/60">
            Each entry is a waypoint, each goal is a destination worth
            celebrating
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Visual Progress</h3>
            <p className="text-sm text-base-content/70">
              Beautiful charts show your weight journey over time
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Goal Celebration</h3>
            <p className="text-sm text-base-content/70">
              Automatic goal completion with permanent achievement tracking
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Your Data</h3>
            <p className="text-sm text-base-content/70">
              Complete privacy with optional cloud sync across devices
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Get Started</h2>
            <p className="text-base-content/70">
              Choose how you'd like to use WeighPoint
            </p>
          </div>

          {/* Primary Actions */}
          <div className="space-y-3">
            <Link to="/auth/signin" className="block">
              <Button variant="primary" className="w-full">
                Sign In
              </Button>
            </Link>

            <Link to="/auth/signup" className="block">
              <Button variant="secondary" className="w-full">
                Create Account
              </Button>
            </Link>

            <div className="divider text-xs text-base-content/50">OR</div>

            <Link to="/guest" className="block">
              <Button variant="ghost" className="w-full">
                Try as Guest
              </Button>
            </Link>
          </div>

          {/* Guest Mode Info */}
          <div className="text-center mt-6">
            <p className="text-xs text-base-content/50">
              Guest mode stores data locally on this device only.
              <br />
              Create an account to sync across devices.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-base-300">
        <p className="text-xs text-base-content/40">
          WeighPoint - Minimalism as power, progress over perfection
        </p>
      </div>
    </div>
  );
};
