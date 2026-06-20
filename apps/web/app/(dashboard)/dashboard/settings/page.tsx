// TODO: wire to GET /school/profile and PATCH /school/profile
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, Button, Input } from '@/components/ui';

interface SchoolProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  plan: string;
}

// TODO: fetch from GET /school/profile
const MOCK_PROFILE: SchoolProfile = {
  name:    'Greenfield Academy',
  phone:   '08012345678',
  email:   'admin@greenfield.sch.ng',
  address: '12 Education Close, Victoria Island',
  city:    'Lagos',
  state:   'Lagos',
  plan:    'STANDARD',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<SchoolProfile>(MOCK_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(key: keyof SchoolProfile, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // TODO: apiFetch('/school/profile', { method: 'PATCH', body: profile })
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your school profile and preferences</p>
      </div>

      {/* School Profile */}
      <Card>
        <CardHeader>
          <CardTitle>School Profile</CardTitle>
        </CardHeader>
        <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
          <Input
            label="School name"
            id="school-name"
            value={profile.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              id="school-phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
            <Input
              label="Email"
              id="school-email"
              type="email"
              value={profile.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <Input
            label="Address"
            id="school-address"
            value={profile.address}
            onChange={(e) => set('address', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="City"
              id="school-city"
              value={profile.city}
              onChange={(e) => set('city', e.target.value)}
            />
            <Input
              label="State"
              id="school-state"
              value={profile.state}
              onChange={(e) => set('state', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
            {saved && (
              <p className="text-sm text-emerald-600 font-medium">Saved!</p>
            )}
          </div>
        </form>
      </Card>

      {/* Plan info */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Current plan:{' '}
              <span className="text-brand-600">{profile.plan}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Renews on 1 August 2025 &bull; ₦24,999/month
            </p>
          </div>
          <Button variant="outline" size="sm">
            Upgrade plan
          </Button>
        </div>
      </Card>

      {/* Notification channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Push notifications', description: 'Send push alerts via the SchoolBridge app', enabled: true },
            { label: 'SMS fallback',       description: 'Auto-send SMS when push fails (uses credits)', enabled: true },
            { label: 'Email digest',       description: 'Weekly summary email to school admin', enabled: false },
          ].map((channel) => (
            <div key={channel.label} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-900">{channel.label}</p>
                <p className="text-xs text-gray-500">{channel.description}</p>
              </div>
              {/* TODO: wire toggle to PATCH /school/notification-settings */}
              <button
                type="button"
                role="switch"
                aria-checked={channel.enabled}
                aria-label={channel.label}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                  channel.enabled ? 'bg-brand-500' : 'bg-gray-200'
                }`}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    channel.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
