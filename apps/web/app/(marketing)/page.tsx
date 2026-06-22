import Link from 'next/link';
import {
  MessageSquare,
  BookOpen,
  ClipboardList,
  BarChart2,
  CreditCard,
  Megaphone,
  Smartphone,
  Wifi,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Logo } from '@/components/ui';
import { SectionHeading } from './_components/SectionHeading';
import { FeatureCard } from './_components/FeatureCard';
import { PricingCard } from './_components/PricingCard';

// ── Hero ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="gradient-hero overflow-hidden py-20 sm:py-28 lg:py-36">
      <div className="container-max section-pad relative">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-24 h-64 w-64 rounded-full bg-brand-300/10 blur-2xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" aria-hidden />
            Built for Nigerian schools
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Replace the{' '}
            <span className="text-gradient">paper booklet</span>
            <br />
            with instant communication
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500 leading-relaxed">
            SchoolBridge connects teachers and parents digitally — homework, daily notes,
            attendance, results, and fee reminders, all in one place. No more lost booklets.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/#pricing"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-7 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
            >
              Get started free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="#"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
            >
              Book a demo
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            30-day free trial &bull; No credit card required &bull; Cancel anytime
          </p>
        </div>

        {/* Hero illustration / mockup */}
        <div className="mt-16 flex justify-center">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden />
              <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden />
              <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden />
              <span className="ml-3 flex-1 rounded-md bg-gray-200 px-3 py-1 text-xs text-gray-400">
                app.schoolbridge.ng/dashboard
              </span>
            </div>

            {/* Dashboard preview */}
            <div className="flex h-64 sm:h-80">
              {/* Mini sidebar */}
              <div className="hidden w-44 shrink-0 border-r border-gray-100 bg-white p-4 sm:block">
                <div className="mb-4 flex items-center">
                  <Logo kind="lockup" color="brand" height={28} />
                </div>
                {['Overview', 'Pupils', 'Messages', 'Attendance', 'Results', 'Fees'].map(
                  (item, i) => (
                    <div
                      key={item}
                      className={`mb-1 rounded-lg px-2 py-1.5 text-xs ${
                        i === 0
                          ? 'bg-brand-50 font-medium text-brand-700'
                          : 'text-gray-500'
                      }`}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>

              {/* Main content */}
              <div className="flex-1 bg-surface p-5">
                <p className="mb-4 text-sm font-semibold text-gray-900">Overview</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Total Pupils', value: '342', color: 'bg-brand-500' },
                    { label: 'Messages Sent', value: '1,204', color: 'bg-emerald-500' },
                    { label: 'Ack Rate', value: '87%', color: 'bg-violet-500' },
                    { label: 'Fees Due', value: '₦2.4M', color: 'bg-amber-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-3 shadow-card">
                      <div className={`mb-2 h-1.5 w-6 rounded-full ${stat.color}`} aria-hidden />
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-card">
                  <p className="mb-3 text-xs font-semibold text-gray-700">Recent Messages</p>
                  {[
                    { type: 'HOMEWORK', pupil: 'Temi Adeyemi', msg: 'Maths assignment due Friday' },
                    { type: 'NOTE', pupil: 'Chukwu Obi', msg: 'Excellent participation today!' },
                    { type: 'FEE_REMINDER', pupil: 'Class 4B', msg: 'Term 2 fees outstanding' },
                  ].map((m) => (
                    <div key={m.msg} className="flex items-center gap-3 py-1.5 text-xs">
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-600">
                        {m.type}
                      </span>
                      <span className="font-medium text-gray-700">{m.pupil}</span>
                      <span className="text-gray-400 truncate">{m.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Problem / Solution ─────────────────────────────────────────────────────

function ProblemSolution() {
  const problems = [
    'Paper booklets get lost, damaged, or forgotten at home',
    'Teachers spend hours writing the same note repeatedly',
    'Parents miss important homework and event reminders',
    'Fee reminders rely on unreliable manual distribution',
    'No record of who received or acknowledged what',
  ];

  const solutions = [
    'Instant digital messages delivered to parents\' phones',
    'One-click bulk messaging to a class or the whole school',
    'Push, SMS, and in-app acknowledgement tracking',
    'Automated fee reminder broadcasts with Paystack links',
    'Full audit trail of every message, read, and reply',
  ];

  return (
    <section className="py-20 sm:py-24">
      <div className="container-max section-pad">
        <SectionHeading
          eyebrow="The problem"
          title="The paper booklet is broken"
          description="Every Nigerian school knows the pain. It's time for a better way."
          centered
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Problems */}
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8">
            <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-red-500">
              Before SchoolBridge
            </p>
            <ul className="flex flex-col gap-4" role="list">
              {problems.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs text-red-500 font-bold">
                    ✕
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-8">
            <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-emerald-600">
              After SchoolBridge
            </p>
            <ul className="flex flex-col gap-4" role="list">
              {solutions.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Daily Notes',
      description:
        'Send personalised notes to individual parents about their child’s day — behaviour, praise, or concerns.',
    },
    {
      icon: BookOpen,
      title: 'Homework Tracker',
      description:
        'Assign homework with due dates. Parents are notified instantly and can acknowledge completion.',
    },
    {
      icon: ClipboardList,
      title: 'Attendance',
      description:
        'Mark attendance digitally each morning. Parents receive immediate SMS alerts when their child is absent.',
    },
    {
      icon: BarChart2,
      title: 'Results & Reports',
      description:
        'Share term results and report cards securely. Parents view grades directly in the app — no printing needed.',
    },
    {
      icon: CreditCard,
      title: 'Fee Reminders',
      description:
        'Broadcast fee reminders with integrated Paystack payment links so parents can pay instantly.',
    },
    {
      icon: Megaphone,
      title: 'School Broadcasts',
      description:
        'Reach every parent at once for PTA meetings, school closures, events, or emergency announcements.',
    },
  ];

  return (
    <section id="features" className="bg-surface py-20 sm:py-24">
      <div className="container-max section-pad">
        <SectionHeading
          eyebrow="Features"
          title="Everything your school needs"
          description="SchoolBridge replaces multiple disjointed tools with one unified communication platform."
          centered
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Built for Nigerian Schools ─────────────────────────────────────────────

function BuiltForNigeria() {
  const pillars = [
    {
      icon: Wifi,
      title: 'Low-data optimised',
      description:
        'Our app is engineered for Nigeria\'s variable network conditions. Pages load under 100KB on 3G.',
    },
    {
      icon: Smartphone,
      title: 'SMS fallback',
      description:
        'If a parent has no smartphone or poor internet, critical messages are automatically routed via SMS.',
    },
    {
      icon: ShieldCheck,
      title: 'Paystack payments',
      description:
        'Fee payment links are powered by Paystack — the most trusted payment processor in Nigeria.',
    },
  ];

  return (
    <section id="for-nigerian-schools" className="py-20 sm:py-24">
      <div className="container-max section-pad">
        <div className="overflow-hidden rounded-3xl bg-brand-500">
          <div className="grid lg:grid-cols-2">
            {/* Text side */}
            <div className="p-10 sm:p-14 lg:p-16">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-200">
                Made in Nigeria, for Nigeria
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Built for the realities of Nigerian schools
              </h2>
              <p className="mt-4 text-base text-brand-100 leading-relaxed">
                We understand epileptic power supply, patchy data connections, and parents
                who only have a basic handset. SchoolBridge was engineered with every
                one of those constraints in mind.
              </p>

              <ul className="mt-8 flex flex-col gap-5" role="list">
                {pillars.map(({ icon: Icon, title, description }) => (
                  <li key={title} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                      <Icon size={20} aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm text-brand-100 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats side */}
            <div className="flex items-center justify-center bg-white/5 p-10 sm:p-14 lg:p-16">
              <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                {[
                  { value: '500+', label: 'Schools onboarded' },
                  { value: '98%', label: 'Message delivery rate' },
                  { value: '87%', label: 'Parent acknowledgement' },
                  { value: '<2s', label: 'Avg. delivery time' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/10 p-6 text-center">
                    <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-brand-100">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────

function Pricing() {
  const plans = [
    {
      plan: 'Trial',
      price: 'Free',
      period: '',
      description: '30-day free trial with full access. No credit card needed.',
      features: [
        'Up to 50 pupils',
        'Daily notes & homework',
        'Attendance tracking',
        'Email support',
      ],
      cta: 'Start free trial',
      highlighted: false,
    },
    {
      plan: 'Basic',
      price: '₦9,999',
      period: '/month',
      description: 'Perfect for small private schools getting started.',
      features: [
        'Up to 200 pupils',
        'All message types',
        'Attendance & results',
        'SMS fallback (100 credits)',
        'Email & chat support',
      ],
      cta: 'Get Basic',
      highlighted: false,
    },
    {
      plan: 'Standard',
      price: '₦24,999',
      period: '/month',
      description: 'The most popular plan for growing schools.',
      features: [
        'Up to 600 pupils',
        'All message types',
        'Paystack fee collection',
        'SMS fallback (500 credits)',
        'Priority support',
        'Analytics dashboard',
      ],
      cta: 'Get Standard',
      highlighted: true,
      badge: 'Most popular',
    },
    {
      plan: 'Premium',
      price: '₦59,999',
      period: '/month',
      description: 'Unlimited scale for large schools and school groups.',
      features: [
        'Unlimited pupils',
        'Multi-branch / group',
        'Dedicated account manager',
        'Unlimited SMS credits',
        'Custom branding',
        'API access',
      ],
      cta: 'Contact sales',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="bg-surface py-20 sm:py-24">
      <div className="container-max section-pad">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          description="Start free and upgrade as your school grows. All plans include a 30-day trial."
          centered
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <PricingCard key={p.plan} {...p} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          All prices exclude VAT. Annual billing available at 20% discount.{' '}
          <a href="#" className="text-brand-500 hover:underline">
            Compare plans in detail
          </a>
        </p>
      </div>
    </section>
  );
}

// ── CTA Banner ─────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-max section-pad">
        <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 px-8 py-16 text-center sm:px-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to ditch the paper booklet?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-brand-100 leading-relaxed">
            Join hundreds of Nigerian schools already communicating faster and smarter
            with SchoolBridge.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/#pricing"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold text-brand-600 shadow-lg transition-all hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600"
            >
              Get started free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="#"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 px-8 text-sm font-semibold text-white transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSolution />
      <Features />
      <BuiltForNigeria />
      <Pricing />
      <CtaBanner />
    </>
  );
}
