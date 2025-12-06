import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ContactInformationCardProps {
  variant: 'mobile' | 'desktop';
  customerName: string;
  setCustomerName: (value: string) => void;
  customerEmail: string;
  setCustomerEmail: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
}

const ContactInformationCard: React.FC<ContactInformationCardProps> = ({
  variant,
  customerName,
  setCustomerName,
  customerEmail,
  setCustomerEmail,
  customerPhone,
  setCustomerPhone,
}) => {
  const NameField = (
    <div className="space-y-2">
      <Label htmlFor={`name-${variant}`}>Full Name *</Label>
      <Input
        id={`name-${variant}`}
        placeholder="Your name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />
    </div>
  );

  const EmailField = (
    <div className="space-y-2">
      <Label htmlFor={`email-${variant}`}>Email *</Label>
      <Input
        id={`email-${variant}`}
        type="email"
        placeholder="your@email.com"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
      />
    </div>
  );

  const PhoneField = (
    <div className="space-y-2">
      <Label htmlFor={`phone-${variant}`}>Phone (Optional)</Label>
      <Input
        id={`phone-${variant}`}
        type="tel"
        placeholder="Your phone number"
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader className={variant === 'mobile' ? 'pb-3' : undefined}>
        <CardTitle className={variant === 'mobile' ? 'text-base' : undefined}>Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variant === 'desktop' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              {NameField}
              {EmailField}
            </div>
            {PhoneField}
          </>
        ) : (
          <div className="space-y-4">
            {NameField}
            {EmailField}
            {PhoneField}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactInformationCard;
