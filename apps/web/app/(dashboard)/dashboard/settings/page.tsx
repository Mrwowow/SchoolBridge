'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { useSchool, useUpdateSchool } from '@/lib/queries';
import { ApiError } from '@/lib/api';

interface ProfileSettings {
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

const EMPTY: ProfileSettings = { phone: '', email: '', address: '', city: '', state: '' };

function readSettings(bag: Record<string, unknown> | undefined): ProfileSettings {
  const s = (bag ?? {}) as Record<string, string | undefined>;
  return {
    phone: s.phone ?? '',
    email: s.email ?? '',
    address: s.address ?? '',
    city: s.city ?? '',
    state: s.state ?? '',
  };
}

export default function SettingsPage() {
  const { data: school, isLoading } = useSchool();
  const updateSchool = useUpdateSchool();

  const [name, setName] = useState('');
  const [profile, setProfile] = useState<ProfileSettings>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Hydrate the form once the school loads.
  useEffect(() => {
    if (school) {
      setName(school.name);
      setProfile(readSettings(school.settings));
    }
  }, [school]);

  function set(key: keyof ProfileSettings, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaved(false);
    try {
      await updateSchool.mutateAsync({
        name: name.trim(),
        settings: { ...(school?.settings ?? {}), ...profile },
      });
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save changes.');
    }
  }

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-gray-400">Loading settings…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your school profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Profile</CardTitle>
        </CardHeader>
        <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {formError}
            </div>
          )}
          <Input
            label="School name"
            id="school-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
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
            <Button type="submit" loading={updateSchool.isPending}>
              Save changes
            </Button>
            {saved && <p className="text-sm font-medium text-emerald-600">Saved!</p>}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Current plan: <span className="text-brand-600">{school?.plan ?? '—'}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Status: {school?.status ?? '—'}
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            Upgrade plan
          </Button>
        </div>
      </Card>
    </div>
  );
}
