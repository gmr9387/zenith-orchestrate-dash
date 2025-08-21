import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { hasBackend, apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface AppSchemaItem {
  id: string;
  name: string;
  schema: any;
  createdAt: number;
  updatedAt: number;
}

const AppBuilder: React.FC = () => {
  const [items, setItems] = useState<AppSchemaItem[]>([]);
  const [name, setName] = useState('My App');
  const [schemaText, setSchemaText] = useState<string>(JSON.stringify({
    title: 'Contact Form',
    fields: [
      { type: 'text', name: 'fullName', label: 'Full Name', required: true },
      { type: 'email', name: 'email', label: 'Email', required: true },
      { type: 'select', name: 'plan', label: 'Plan', options: ['Free', 'Pro', 'Enterprise'] },
    ]
  }, null, 2));
  const [previewSchema, setPreviewSchema] = useState<any>(null);
  const [selected, setSelected] = useState<AppSchemaItem | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (hasBackend()) {
          const resp = await apiGet(`/app-schemas`);
          const data = (resp as any).data;
          if (Array.isArray(data)) setItems(data as AppSchemaItem[]);
        }
      } catch (e) { /* routed to UX toast in future */ }
    })();
  }, []);

  const createSchema = async () => {
    try {
      const parsed = JSON.parse(schemaText);
      if (hasBackend()) {
        const resp = await apiPost(`/app-schemas`, { name, schema: parsed });
        const created = (resp as any).data as AppSchemaItem;
        setItems(prev => [created, ...prev]);
        setSelected(created);
      }
    } catch (e) {
      alert('Invalid JSON schema');
    }
  };

  const updateSchema = async (item: AppSchemaItem) => {
    try {
      const parsed = JSON.parse(schemaText);
      if (hasBackend()) {
        const resp = await apiPut(`/app-schemas/${item.id}`, { name, schema: parsed });
        const updated = (resp as any).data as AppSchemaItem;
        setItems(prev => prev.map(it => it.id === updated.id ? updated : it));
        setSelected(updated);
      }
    } catch (e) {
      alert('Invalid JSON schema');
    }
  };

  const deleteSchema = async (item: AppSchemaItem) => {
    if (!confirm('Delete app schema?')) return;
    try {
      if (hasBackend()) await apiDelete(`/app-schemas/${item.id}`);
      setItems(prev => prev.filter(it => it.id !== item.id));
      if (selected?.id === item.id) setSelected(null);
    } catch { /* ignore */ }
  };

  const preview = () => {
    try {
      const parsed = JSON.parse(schemaText);
      setPreviewSchema(parsed);
    } catch {
      alert('Invalid JSON schema');
    }
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <div key={field.name} className="space-y-1">
            <label className="text-sm">{field.label}</label>
            <Input type={field.type} placeholder={field.label} required={field.required} />
          </div>
        );
      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <label className="text-sm">{field.label}</label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {(field.options || []).map((opt: string) => (<option key={opt}>{opt}</option>))}
            </select>
          </div>
        );
      default:
        return (
          <div key={field.name} className="text-xs text-muted-foreground">Unsupported field type: {String(field.type)}</div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Builder</CardTitle>
              <CardDescription>Design simple apps from JSON schema and preview instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm">Schema (JSON)</label>
                <Textarea rows={16} value={schemaText} onChange={(e) => setSchemaText(e.target.value)} className="font-mono" />
              </div>
              <div className="flex gap-2">
                <Button onClick={preview}>Preview</Button>
                <Button variant="outline" onClick={createSchema}>Save</Button>
                {selected && (
                  <>
                    <Button variant="outline" onClick={() => updateSchema(selected)}>Update</Button>
                    <Button variant="destructive" onClick={() => deleteSchema(selected)}>Delete</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {previewSchema && (
            <Card>
              <CardHeader>
                <CardTitle>Preview: {name}</CardTitle>
                <CardDescription>Generated UI from schema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(previewSchema.fields || []).map((f: any) => renderField(f))}
                </div>
                <div>
                  <Button className="w-full">Submit</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Saved Apps</CardTitle>
              <CardDescription>Manage your saved schemas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className={`p-3 border rounded-lg cursor-pointer ${selected?.id === item.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => { setSelected(item); setName(item.name); setSchemaText(JSON.stringify(item.schema, null, 2)); }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString()}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">#{item.id.slice(-6)}</Badge>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground">No items yet. Save an app schema to get started.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppBuilder;