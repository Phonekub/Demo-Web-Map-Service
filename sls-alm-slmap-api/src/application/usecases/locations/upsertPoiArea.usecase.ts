import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { AreaEntity } from '../../../adapter/outbound/repositories/entities/area.entity';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface UpsertPoiAreaRequest {
  poiId: number;
  coordinates: Coordinate[];
  name?: string;
  props?: Record<string, unknown>;
}

@Injectable()
export class UpsertPoiAreaUseCase {
  constructor(
    @Inject('PoiRepository') private readonly poiRepository: PoiRepositoryPort,
  ) {}

  async handler(request: UpsertPoiAreaRequest): Promise<AreaEntity> {
    const { poiId, coordinates } = request;

    // 1. Validate input
    await this.validateInput(request);

    // 2. Get POI center point
    const poi = await this.poiRepository.findById(poiId);
    if (!poi) {
      throw new BadRequestException(`POI with ID ${poiId} not found`);
    }
    const poiCenter = this.extractCoordinatesFromGeometry(poi.geom);

    // 3. Validate distance from center point (600m limit)
    await this.validateDistanceFromCenter(coordinates, poiCenter);

    // 4. Check for overlapping areas
    await this.checkForOverlappingAreas(coordinates, poiId);

    // 5. Create/Update area
    return await this.upsertArea(request);
  }

  private async validateInput(request: UpsertPoiAreaRequest): Promise<void> {
    const { poiId, coordinates } = request;

    if (!poiId || poiId <= 0) {
      throw new BadRequestException('Valid POI ID is required');
    }

    if (!coordinates || coordinates.length < 3) {
      throw new BadRequestException(
        'At least 3 coordinates are required to form a polygon',
      );
    }

    // Validate coordinate format
    for (const coord of coordinates) {
      if (
        typeof coord.lat !== 'number' ||
        typeof coord.lng !== 'number' ||
        isNaN(coord.lat) ||
        isNaN(coord.lng)
      ) {
        throw new BadRequestException(
          'Invalid coordinate format. lat and lng must be numbers',
        );
      }

      if (coord.lat < -90 || coord.lat > 90) {
        throw new BadRequestException('Latitude must be between -90 and 90');
      }

      if (coord.lng < -180 || coord.lng > 180) {
        throw new BadRequestException('Longitude must be between -180 and 180');
      }
    }

    // Ensure polygon is closed (first and last coordinates should be the same)
    const firstCoord = coordinates[0];
    const lastCoord = coordinates[coordinates.length - 1];
    if (firstCoord.lat !== lastCoord.lat || firstCoord.lng !== lastCoord.lng) {
      // Auto-close the polygon
      coordinates.push({ ...firstCoord });
    }
  }

  private extractCoordinatesFromGeometry(geom: {
    type: string;
    coordinates: number[];
  }): Coordinate {
    if (geom.type !== 'Point' || !geom.coordinates || geom.coordinates.length !== 2) {
      throw new BadRequestException('Invalid POI geometry format');
    }

    return {
      lng: geom.coordinates[0],
      lat: geom.coordinates[1],
    };
  }

  private async validateDistanceFromCenter(
    coordinates: Coordinate[],
    center: Coordinate,
  ): Promise<void> {
    const maxDistanceMeters = 2000;

    for (const coord of coordinates) {
      const distance = this.calculateDistance(center, coord);
      if (distance > maxDistanceMeters) {
        throw new BadRequestException(
          `Coordinate (${coord.lat}, ${coord.lng}) is ${distance.toFixed(2)}m away from POI center, exceeding the 600m limit`,
        );
      }
    }
  }

  private calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    // Haversine formula to calculate distance between two points
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
        Math.cos(this.toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async checkForOverlappingAreas(
    coordinates: Coordinate[],
    currentPoiId: number,
  ): Promise<void> {
    // Convert coordinates to WKT polygon format
    const polygonWkt = this.coordinatesToWkt(coordinates);

    // Check for overlapping areas using spatial queries
    const overlappingAreas = await this.poiRepository.findOverlappingAreas(
      polygonWkt,
      currentPoiId,
    );

    if (overlappingAreas && overlappingAreas.length > 0) {
      const overlappingPoiIds = overlappingAreas.map((area) => area.ownerPoiId);
      throw new BadRequestException(
        `Area polygon overlaps with existing areas from POI(s): ${overlappingPoiIds.join(', ')}`,
      );
    }
  }

  private coordinatesToWkt(coordinates: Coordinate[]): string {
    const coordStrings = coordinates.map((coord) => `${coord.lng} ${coord.lat}`);
    return `POLYGON((${coordStrings.join(', ')}))`;
  }

  private async upsertArea(request: UpsertPoiAreaRequest): Promise<AreaEntity> {
    const { poiId, coordinates, name, props } = request;

    const polygonWkt = this.coordinatesToWkt(coordinates);

    // Check if area already exists for this POI
    const existingArea = await this.poiRepository.findAreaByPoiId(poiId);

    const areaData = {
      name: name || `Area for POI ${poiId}`,
      shape: 'polygon' as const,
      geom: polygonWkt,
      ownerPoiId: poiId,
      props: props || {},
    };

    if (existingArea) {
      // Update existing area
      return await this.poiRepository.updateArea(existingArea.id, areaData);
    } else {
      // Create new area
      return await this.poiRepository.createArea(areaData);
    }
  }
}
