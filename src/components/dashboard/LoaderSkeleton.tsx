import { Card, CardContent } from "@/components/ui/card";

export default function LoaderSkeleton() {
    return (
        <div className="mt-12 space-y-4">
            <Card>
                <div className="p-6 border-b">
                    <div className="h-6 w-48 bg-neutral-100 animate-pulse rounded" />
                </div>
                <CardContent className="p-6 space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 p-4 border rounded-lg animate-pulse">
                            <div className="space-y-3 flex-1">
                                <div className="h-4 w-1/4 bg-neutral-100 rounded" />
                                <div className="h-3 w-1/2 bg-neutral-50 rounded" />
                            </div>
                            <div className="h-10 w-24 bg-neutral-100 rounded" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
