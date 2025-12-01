'use client';

interface AnimatedBackgroundProps {
  slow?: boolean;
}

export default function AnimatedBackground({ slow = false }: AnimatedBackgroundProps) {
  const speedMultiplier = slow ? 2 : 1;

  return (
    <div className={`absolute inset-0 overflow-hidden ${slow ? 'slow-animation' : ''}`}>
      {/* Animated Gradient Background - Base Layer */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 animate-gradient-shift"></div>

      {/* Circuit Board Pattern - Above Gradient */}
      <div className="absolute inset-0 z-10">
        {/* Circuit Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-circuit-grid"></div>
        </div>

        {/* Main Circuit Traces - Horizontal */}
        <div className="absolute top-[15%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"></div>
        <div className="absolute top-[35%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
        <div className="absolute top-[55%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent"></div>
        <div className="absolute top-[75%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent"></div>
        <div className="absolute top-[85%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"></div>

        {/* Main Circuit Traces - Vertical */}
        <div className="absolute top-0 left-[10%] w-[2px] h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"></div>
        <div className="absolute top-0 left-[25%] w-[2px] h-full bg-gradient-to-b from-transparent via-indigo-400/35 to-transparent"></div>
        <div className="absolute top-0 left-[45%] w-[2px] h-full bg-gradient-to-b from-transparent via-emerald-400/40 to-transparent"></div>
        <div className="absolute top-0 left-[65%] w-[2px] h-full bg-gradient-to-b from-transparent via-indigo-400/30 to-transparent"></div>
        <div className="absolute top-0 left-[85%] w-[2px] h-full bg-gradient-to-b from-transparent via-blue-400/25 to-transparent"></div>

        {/* L-Shaped Circuit Traces */}
        <div className="absolute top-[15%] left-[25%] w-[20%] h-[2px] bg-indigo-400/30"></div>
        <div className="absolute top-[15%] left-[45%] w-[2px] h-[20%] bg-indigo-400/30"></div>

        <div className="absolute top-[55%] left-[65%] w-[20%] h-[2px] bg-emerald-400/30"></div>
        <div className="absolute top-[55%] left-[85%] w-[2px] h-[20%] bg-emerald-400/30"></div>

        <div className="absolute top-[75%] left-[10%] w-[2px] h-[10%] bg-blue-400/30"></div>
        <div className="absolute top-[85%] left-[10%] w-[15%] h-[2px] bg-blue-400/30"></div>

        {/* Connection Nodes at Intersections */}
        <div className="absolute top-[15%] left-[25%] w-4 h-4 bg-indigo-400/60 rounded-full animate-pulse-node shadow-lg shadow-indigo-400/30"></div>
        <div className="absolute top-[15%] left-[45%] w-3 h-3 bg-emerald-400/50 rounded-full animate-pulse-node-delay-1"></div>
        <div className="absolute top-[35%] left-[25%] w-3 h-3 bg-blue-400/50 rounded-full animate-pulse-node-delay-2"></div>
        <div className="absolute top-[35%] left-[65%] w-4 h-4 bg-indigo-400/60 rounded-full animate-pulse-node shadow-lg shadow-indigo-400/30"></div>
        <div className="absolute top-[55%] left-[10%] w-3 h-3 bg-emerald-400/50 rounded-full animate-pulse-node-delay-3"></div>
        <div className="absolute top-[55%] left-[45%] w-5 h-5 bg-indigo-500/70 rounded-full animate-pulse-node-center shadow-lg shadow-indigo-500/50"></div>
        <div className="absolute top-[55%] left-[85%] w-3 h-3 bg-blue-400/50 rounded-full animate-pulse-node-delay-1"></div>
        <div className="absolute top-[75%] left-[25%] w-3 h-3 bg-indigo-400/50 rounded-full animate-pulse-node-delay-2"></div>
        <div className="absolute top-[75%] left-[65%] w-4 h-4 bg-emerald-400/60 rounded-full animate-pulse-node shadow-lg shadow-emerald-400/30"></div>
        <div className="absolute top-[85%] left-[45%] w-3 h-3 bg-blue-400/50 rounded-full animate-pulse-node-delay-3"></div>

        {/* Circuit IC Chips (Rectangles) */}
        <div className="absolute top-[25%] left-[60%] w-32 h-16 border border-indigo-400/30 bg-indigo-500/5 animate-pulse-glow">
          <div className="absolute -left-2 top-2 w-2 h-1 bg-indigo-400/40"></div>
          <div className="absolute -left-2 top-5 w-2 h-1 bg-indigo-400/40"></div>
          <div className="absolute -left-2 top-8 w-2 h-1 bg-indigo-400/40"></div>
          <div className="absolute -left-2 top-11 w-2 h-1 bg-indigo-400/40"></div>
          <div className="absolute -right-2 top-2 w-2 h-1 bg-indigo-400/40"></div>
          <div className="absolute -right-2 top-5 w-2 h-1 bg-indigo-400/40"></div>
          <div className="absolute -right-2 top-8 w-2 h-1 bg-indigo-400/40"></div>
          <div className="absolute -right-2 top-11 w-2 h-1 bg-indigo-400/40"></div>
        </div>

        <div className="absolute top-[65%] left-[15%] w-24 h-12 border border-blue-400/30 bg-blue-500/5 animate-pulse-glow-delay">
          <div className="absolute -left-2 top-2 w-2 h-1 bg-blue-400/40"></div>
          <div className="absolute -left-2 top-5 w-2 h-1 bg-blue-400/40"></div>
          <div className="absolute -left-2 top-8 w-2 h-1 bg-blue-400/40"></div>
          <div className="absolute -right-2 top-2 w-2 h-1 bg-blue-400/40"></div>
          <div className="absolute -right-2 top-5 w-2 h-1 bg-blue-400/40"></div>
          <div className="absolute -right-2 top-8 w-2 h-1 bg-blue-400/40"></div>
        </div>

        <div className="absolute top-[40%] left-[5%] w-20 h-20 border border-emerald-400/30 bg-emerald-500/5 animate-pulse-glow">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400/50 rounded-full animate-pulse-node"></div>
        </div>

        {/* Data Particles Flowing Along Traces */}
        <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-indigo-400 rounded-full animate-data-flow-horizontal shadow-md shadow-indigo-400/50"></div>
        <div className="absolute top-[35%] left-[30%] w-2 h-2 bg-blue-400 rounded-full animate-data-flow-horizontal-delay shadow-md shadow-blue-400/50"></div>
        <div className="absolute top-[55%] left-[50%] w-2 h-2 bg-emerald-400 rounded-full animate-data-flow-horizontal shadow-md shadow-emerald-400/50"></div>
        <div className="absolute top-[20%] left-[45%] w-2 h-2 bg-indigo-400 rounded-full animate-data-flow-vertical shadow-md shadow-indigo-400/50"></div>
        <div className="absolute top-[40%] left-[65%] w-2 h-2 bg-blue-400 rounded-full animate-data-flow-vertical-delay shadow-md shadow-blue-400/50"></div>
      </div>

      {/* Floating Glow Orbs */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl animate-float-medium"></div>
      </div>

      {/* Overlay for depth */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-t from-gray-900/40 via-transparent to-transparent pointer-events-none"></div>

      <style jsx>{`
        :global(.slow-animation) .animate-gradient-shift {
          animation-duration: 30s !important;
        }
        :global(.slow-animation) .animate-float-slow {
          animation-duration: 40s !important;
        }
        :global(.slow-animation) .animate-float-slower {
          animation-duration: 50s !important;
        }
        :global(.slow-animation) .animate-float-medium {
          animation-duration: 36s !important;
        }
        :global(.slow-animation) .animate-pulse-glow,
        :global(.slow-animation) .animate-pulse-glow-delay {
          animation-duration: 6s !important;
        }
        :global(.slow-animation) .animate-pulse-node,
        :global(.slow-animation) .animate-pulse-node-delay-1,
        :global(.slow-animation) .animate-pulse-node-delay-2,
        :global(.slow-animation) .animate-pulse-node-delay-3 {
          animation-duration: 4s !important;
        }
        :global(.slow-animation) .animate-pulse-node-center {
          animation-duration: 5s !important;
        }
        :global(.slow-animation) .animate-data-flow-horizontal {
          animation-duration: 16s !important;
        }
        :global(.slow-animation) .animate-data-flow-horizontal-delay {
          animation-duration: 20s !important;
        }
        :global(.slow-animation) .animate-data-flow-vertical {
          animation-duration: 14s !important;
        }
        :global(.slow-animation) .animate-data-flow-vertical-delay {
          animation-duration: 18s !important;
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float-slower {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, 40px) scale(1.15);
          }
        }

        @keyframes float-medium {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(25px, 25px) scale(1.05);
          }
          75% {
            transform: translate(-25px, -15px) scale(0.95);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        @keyframes pulse-glow-delay {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        @keyframes pulse-node {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
            box-shadow: 0 0 0 0 currentColor;
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
            box-shadow: 0 0 10px 2px currentColor;
          }
        }

        @keyframes pulse-node-center {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        @keyframes data-flow-1 {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(200px, -100px);
            opacity: 0;
          }
        }

        @keyframes data-flow-2 {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(-180px, 120px);
            opacity: 0;
          }
        }

        @keyframes data-flow-3 {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(150px, 100px);
            opacity: 0;
          }
        }

        @keyframes data-flow-4 {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(-120px, -150px);
            opacity: 0;
          }
        }

        @keyframes data-flow-horizontal {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            transform: translateX(80vw);
            opacity: 0;
          }
        }

        @keyframes data-flow-vertical {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            transform: translateY(60vh);
            opacity: 0;
          }
        }

        .animate-gradient-shift {
          background-size: 400% 400%;
          animation: gradient-shift 15s ease infinite;
        }

        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        .animate-float-slower {
          animation: float-slower 25s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 18s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-pulse-glow-delay {
          animation: pulse-glow-delay 3s ease-in-out infinite 1.5s;
        }

        .animate-pulse-node {
          animation: pulse-node 2s ease-in-out infinite;
        }

        .animate-pulse-node-delay-1 {
          animation: pulse-node 2s ease-in-out infinite 0.5s;
        }

        .animate-pulse-node-delay-2 {
          animation: pulse-node 2s ease-in-out infinite 1s;
        }

        .animate-pulse-node-delay-3 {
          animation: pulse-node 2s ease-in-out infinite 1.5s;
        }

        .animate-pulse-node-center {
          animation: pulse-node-center 2.5s ease-in-out infinite;
        }

        .animate-data-flow-horizontal {
          animation: data-flow-horizontal 8s linear infinite;
        }

        .animate-data-flow-horizontal-delay {
          animation: data-flow-horizontal 10s linear infinite 3s;
        }

        .animate-data-flow-vertical {
          animation: data-flow-vertical 7s linear infinite;
        }

        .animate-data-flow-vertical-delay {
          animation: data-flow-vertical 9s linear infinite 2s;
        }

        .bg-circuit-grid {
          background-image:
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
          background-size: 30px 30px;
        }
      `}</style>
    </div>
  );
}
