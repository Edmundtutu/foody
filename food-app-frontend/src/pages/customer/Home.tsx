import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext.tsx';
import { useQuery } from '@tanstack/react-query';
import PostItem from '@/components/customer/home/PostItem';
import { postService } from '@/services/postService';
import QuickStatsGrid from '@/components/customer/home/QuickStatsGrid';
import { MessageCircle } from 'lucide-react';
import { TextCarousel } from '@/components/features/TextCarousel';

const Home: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect restaurant users to their dashboard
    useEffect(() => {
        if (user?.role === 'restaurant') {
            navigate('/vendor/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const { data: postsData, isLoading, error } = useQuery({
        queryKey: ['posts'],
        queryFn: postService.getPosts,
    });

    // Don't render customer content if user is a restaurant (will redirect)
    if (user?.role === 'restaurant') {
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        console.error("Error fetching posts:", error);
        return (
            <div className="text-center text-destructive py-12">
                Failed to load posts. Please try again later.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="px-4 py-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="User"
                                    className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                                    <span className="text-xl font-semibold text-gray-600">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <TextCarousel
                            className="flex-1 text-muted-foreground text-sm"
                            texts={[
                                'Discover delicious meals near you',
                                'Nearby restaurants have amazing food! Check it out',
                                'What are you craving today?',
                                'Order your favorite dish now',
                                'Join friends for a delicious meal',
                                'Share your food experience',
                                'Rate your favorite restaurants',
                            ]}
                            interval={4000}
                            transitionDuration={300}
                        />
                    </div>
                </div>
                <div className="border-b border-gray-200"></div>
                <QuickStatsGrid />
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-4">
                {/* Feed */}
                {!postsData || postsData.length === 0 ? (
                    <Card className="shadow-sm">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                            <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
                                Start following others to see their posts, or create your first post from your orders!
                            </p>
                            <Button asChild>
                                <Link to="/discover">Discover Dishes</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {postsData.map((post) => (
                            <PostItem key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;

