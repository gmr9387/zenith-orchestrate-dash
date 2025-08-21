import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  Building,
  User,
  Filter,
  MoreHorizontal,
  Star,
  MessageSquare
} from 'lucide-react';
import { crmApi, Contact } from '@/lib/crm-api';
import { ContactForm } from './ContactForm';

export const ContactManagement: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    loadContacts();
  }, [searchTerm]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await crmApi.getContacts({ 
        search: searchTerm || undefined,
        limit: 50 
      });
      setContacts(response.data.contacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await crmApi.createContact(contactData);
      setShowContactForm(false);
      loadContacts();
    } catch (error) {
      console.error('Failed to create contact:', error);
    }
  };

  const handleUpdateContact = async (id: string, contactData: Partial<Contact>) => {
    try {
      await crmApi.updateContact(id, contactData);
      setEditingContact(null);
      loadContacts();
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await crmApi.deleteContact(id);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatLastContacted = (date: string | null) => {
    if (!date) return 'Never';
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
        
        <Button onClick={() => setShowContactForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {contacts.map((contact) => (
            <motion.div
              key={contact.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className="glass-card hover-lift cursor-pointer"
                onClick={() => setSelectedContact(contact)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingContact(contact);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.company || 'No company'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-1">
                      {contact.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      {formatLastContacted(contact.lastContactedAt)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="mr-2 h-3 w-3" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="mr-2 h-3 w-3" />
                      Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {contacts.length === 0 && !loading && (
        <Card className="glass-card">
          <CardContent className="text-center py-16">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first contact to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowContactForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactForm
          onSave={handleCreateContact}
          onClose={() => setShowContactForm(false)}
        />
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <ContactForm
          contact={editingContact}
          onSave={(data) => handleUpdateContact(editingContact.id, data)}
          onClose={() => setEditingContact(null)}
          onDelete={() => handleDeleteContact(editingContact.id)}
        />
      )}

      {/* Contact Detail Modal */}
      {selectedContact && !editingContact && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <Card className="glass-intense">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedContact.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {getInitials(selectedContact.firstName, selectedContact.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedContact.firstName} {selectedContact.lastName}
                      </h2>
                      <p className="text-muted-foreground">{selectedContact.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedContact.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingContact(selectedContact)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)}>
                      ×
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedContact.email}</span>
                        </div>
                        {selectedContact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedContact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedContact.tags.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-1">
                          {selectedContact.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Activity</h3>
                      <div className="text-sm space-y-1">
                        <p>Last contacted: {formatLastContacted(selectedContact.lastContactedAt)}</p>
                        <p>Added: {new Date(selectedContact.createdAt).toLocaleDateString()}</p>
                        <p>Source: {selectedContact.source || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedContact.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedContact.notes}</p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button className="flex-1">
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};