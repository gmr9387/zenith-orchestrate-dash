import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hasBackend, apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: number;
  updatedAt: number;
}

const CRM: React.FC = () => {
  const [items, setItems] = useState<Contact[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (hasBackend()) {
          const resp = await apiGet(`/crm/contacts`);
          const data = (resp as any).data as Contact[];
          if (Array.isArray(data)) setItems(data);
        }
      } catch (e) { /* routed to UX toast in future */ }
    })();
  }, []);

  const addContact = async () => {
    if (!firstName.trim() || !email.trim()) return;
    const resp = hasBackend() ? await apiPost(`/crm/contacts`, { firstName, lastName, email }) : { data: { id: `${Date.now()}`, firstName, lastName, email, createdAt: Date.now(), updatedAt: Date.now() } } as any;
    const c = (resp as any).data as Contact;
    setItems((prev) => [c, ...prev]);
    setFirstName(''); setLastName(''); setEmail('');
  };

  const remove = async (id: string) => {
    if (hasBackend()) await apiDelete(`/crm/contacts/${id}`);
    setItems((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>CRM Contacts</CardTitle>
            <CardDescription>Manage your customer contacts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={addContact} disabled={!firstName || !email}>Add Contact</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>{items.length} total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((c) => (
              <div key={c.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.firstName} {c.lastName}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => remove(c.id)}>Delete</Button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="text-sm text-muted-foreground">No contacts yet. Add your first contact above.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRM;

