/**
 * 位置情報取得ヘルパー関数
 */

import type { LocationData } from './attendance-store';

interface GeolocationResult {
  success: boolean;
  location?: LocationData;
  error?: string;
}

/**
 * 現在位置を取得する
 * @param options - Geolocation API options
 * @returns 位置情報または エラー
 */
export async function getCurrentLocation(
  options?: PositionOptions
): Promise<GeolocationResult> {
  // ブラウザがGeolocation APIをサポートしているか確認
  if (!navigator.geolocation) {
    return {
      success: false,
      error: 'お使いのブラウザは位置情報機能をサポートしていません',
    };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        options || {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });

    const location: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date().toISOString(),
    };

    // 住所の逆ジオコーディング（オプション）
    try {
      const address = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );
      if (address) {
        location.address = address;
      }
    } catch (error) {
      // 住所取得失敗は無視
      console.warn('Failed to reverse geocode:', error);
    }

    return {
      success: true,
      location,
    };
  } catch (error) {
    let errorMessage = '位置情報の取得に失敗しました';

    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '位置情報の使用が許可されていません';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = '位置情報が利用できません';
          break;
        case error.TIMEOUT:
          errorMessage = '位置情報の取得がタイムアウトしました';
          break;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 座標から住所を取得する（逆ジオコーディング）
 * @param latitude - 緯度
 * @param longitude - 経度
 * @returns 住所文字列
 */
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  // 外部ジオコーディングAPIを使用
  // 例: OpenStreetMap Nominatim API（無料、利用規約に注意）
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ja`,
      {
        headers: {
          'User-Agent': 'DandoriPortal/1.0',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * 2点間の距離を計算する（メートル単位）
 * @param lat1 - 地点1の緯度
 * @param lon1 - 地点1の経度
 * @param lat2 - 地点2の緯度
 * @param lon2 - 地点2の経度
 * @returns 距離（メートル）
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 指定エリア内にいるか確認する
 * @param currentLat - 現在地の緯度
 * @param currentLon - 現在地の経度
 * @param targetLat - 目標地点の緯度
 * @param targetLon - 目標地点の経度
 * @param radiusMeters - 許容半径（メートル）
 * @returns エリア内にいる場合true
 */
export function isWithinArea(
  currentLat: number,
  currentLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number = 100
): boolean {
  const distance = calculateDistance(currentLat, currentLon, targetLat, targetLon);
  return distance <= radiusMeters;
}

/**
 * Google Maps URLを生成する
 * @param latitude - 緯度
 * @param longitude - 経度
 * @returns Google Maps URL
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
