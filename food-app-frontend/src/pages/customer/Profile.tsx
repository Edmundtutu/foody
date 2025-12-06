import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    Settings,
    ShoppingBag,
    Utensils
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OrderHistory from '@/components/customer/profile/orders/OrderHistory';

const Profile: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="w-full max-w-none px-2 sm:max-w-4xl sm:mx-auto space-y-4 sm:space-y-6">
            {/* Profile Header */}
            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center">
                            <User className="h-10 w-10 sm:h-12 sm:w-12 text-primary-foreground" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-xl sm:text-2xl font-bold">{user?.name}</h1>
                            <p className="text-muted-foreground text-sm sm:text-base">{user?.email}</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-2">
                                <Badge variant={user?.verified ? 'default' : 'secondary'} className="text-xs">
                                    {user?.verified ? 'Verified' : 'Unverified'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {user?.role === 'customer' ?
                                        (user?.isInfluencer ? 'Influencer' : 'Customer') : 'Vendor'}
                                </Badge>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="orders" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger value="orders" className="text-xs sm:text-sm px-2 py-2">
                        <ShoppingBag className="h-4 w-4 mr-1 sm:mr-2" />
                        Orders
                    </TabsTrigger>
                    <TabsTrigger value="dishes" className="text-xs sm:text-sm px-2 py-2">
                        <Utensils className="h-4 w-4 mr-1 sm:mr-2" />
                        Dishes
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 py-2">
                        <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Orders</CardTitle>
                            <CardDescription>View your past orders and their status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OrderHistory />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Dishes Tab */}
                <TabsContent value="dishes" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Favorite Dishes</h2>
                    </div>

                    <Card>
                        <CardContent className="p-8 text-center">
                            <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No favorite dishes yet</h3>
                            <p className="text-muted-foreground">
                                Start exploring and save dishes you love to find them easily later
                            </p>
                            <Button variant="default" className="mt-4">
                                Browse Dishes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                    <h2 className="text-xl font-semibold">Account Settings</h2>

                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Full Name</label>
                                    <p className="text-sm text-muted-foreground">{user?.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Phone</label>
                                    <p className="text-sm text-muted-foreground">
                                        {user?.phone || 'Not provided'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Location</label>
                                    <p className="text-sm text-muted-foreground">
                                        {user?.location?.address || 'Not provided'}
                                    </p>
                                </div>
                            </div>
                            <Button>Edit Information</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Preferences</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium">Email Notifications</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Receive updates about your orders and new dishes
                                    </p>
                                </div>
                                <Button variant="outline">Manage</Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium">Privacy Settings</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Control who can see your profile and activity
                                    </p>
                                </div>
                                <Button variant="outline">Manage</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Profile;

