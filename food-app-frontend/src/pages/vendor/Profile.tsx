import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useVendor } from '@/context/VendorContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Store } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileFormSkeleton } from '@/components/vendor/LoadingSkeletons';

interface ProfileFormData {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const VendorProfile: React.FC = () => {
  const { restaurant, isLoading } = useVendor();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      name: restaurant?.name ?? '',
      description: restaurant?.description ?? '',
      phone: restaurant?.phone ?? '',
      email: restaurant?.email ?? '',
      address: restaurant?.address ?? '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement restaurant update API call
      toast.success('Restaurant profile updated successfully');
      console.log('Profile update:', data);
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to update restaurant profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your restaurant information</p>
        </div>
        <ProfileFormSkeleton />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Profile</h1>
          <p className="text-muted-foreground mt-1">Set up your restaurant</p>
        </div>

        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No restaurant found</h3>
            <p className="text-muted-foreground">
              Create a restaurant profile to get started
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Restaurant Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your restaurant information and settings</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>
            Update your restaurant details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Restaurant name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your restaurant name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell customers about your restaurant" 
                        className="min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of your restaurant and cuisine
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+256..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@restaurant.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Your restaurant address" 
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorProfile;