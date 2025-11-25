'use client';

import { MapPin, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { LocationData } from '@/lib/attendance-store';
import { getGoogleMapsUrl } from '@/lib/geolocation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface LocationBadgeProps {
  location: LocationData;
  label?: string;
}

export function LocationBadge({ location, label = '位置情報' }: LocationBadgeProps) {
  const mapsUrl = getGoogleMapsUrl(location.latitude, location.longitude);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-accent flex items-center gap-1"
        >
          <MapPin className="h-3 w-3" />
          <span className="text-xs">{label}</span>
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4" />
            <span>位置情報</span>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">座標</div>
              <div className="font-mono">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            </div>

            {location.address && (
              <div>
                <div className="text-muted-foreground text-xs">住所</div>
                <div>{location.address}</div>
              </div>
            )}

            <div>
              <div className="text-muted-foreground text-xs">記録時刻</div>
              <div>
                {format(new Date(location.timestamp), 'yyyy/MM/dd HH:mm:ss', { locale: ja })}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(mapsUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google マップで開く
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
