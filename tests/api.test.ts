import request from 'supertest';
import sqlite3, { Database } from 'sqlite3';
import app from '../src/app';
import buildSchemas from '../src/schemas';
import ErrorCode from '../src/errors/ErrorCode';
import ErrorMessage from '../src/errors/ErrorMessage';
import getMockRides from './stubs/getMockRides';
import getMockRidePayload from './stubs/getMockRidePayload';
import db from '../src/sqlite3';

jest.mock('../src/sqlite3', () => {
  return new (sqlite3.verbose().Database)(':memory:');
});

jest.mock('../src/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe('API tests', () => {
  const postRide = (payload: Record<string, any>) => {
    return request(app)
      .post('/rides')
      .send(payload)
      .set('Accept', 'application/json');
  };

  beforeEach(async () => {
    await db.serialize();
    buildSchemas(db);
  });

  afterEach(async () => {
    await db.run('DROP TABLE Rides');
  });

  describe('GET /health', () => {
    it('should return health', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /rides', () => {
    it('should return rides not found error', async () => {
      const response = await request(app)
        .get('/rides')
        .set('Accept', 'application/json');

      expect(response.body.errorCode).toBe(ErrorCode.RIDES_NOT_FOUND_ERROR);
      expect(response.status).toBe(404);
    });

    it('should return an unknown error', async () => {
      jest.spyOn(db, 'all').mockImplementationOnce((): Database => {
        throw new Error('something bad happened!');
      });
      const response = await request(app)
        .get('/rides')
        .set('Accept', 'application/json');

      expect(response.body.errorCode).toBe(ErrorCode.SERVER_ERROR);
      expect(response.status).toBe(500);
    });

    it('should return an array of rides', async () => {
      const mockData = getMockRidePayload();
      await postRide(mockData);
      const response = await request(app)
        .get('/rides')
        .set('Accept', 'application/json');

      expect(response.body).toMatchObject(getMockRides());
      expect(response.status).toBe(200);
    });
  });

  describe('POST /rides', () => {
    it('should return validation error on startLat', async () => {
      const payload = {
        ...getMockRidePayload(),
        startLat: 91,
      };
      const response = await postRide(payload);

      expect(response.body.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.body.message).toBe(
        ErrorMessage.INVALID_START_LATITUDE_LONGITUDE,
      );
      expect(response.status).toBe(400);
    });

    it('should return validation error on startLong', async () => {
      const payload = {
        ...getMockRidePayload(),
        startLong: 181,
      };
      const response = await postRide(payload);

      expect(response.body.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.body.message).toBe(
        ErrorMessage.INVALID_START_LATITUDE_LONGITUDE,
      );
      expect(response.status).toBe(400);
    });

    it('should return validation error on endLat', async () => {
      const payload = {
        ...getMockRidePayload(),
        endLat: 92,
      };
      const response = await postRide(payload);

      expect(response.body.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.body.message).toBe(
        ErrorMessage.INVALID_END_LATITUDE_LONGITUDE,
      );
      expect(response.status).toBe(400);
    });

    it('should return validation error on endLong', async () => {
      const payload = {
        ...getMockRidePayload(),
        endLong: 182,
      };
      const response = await postRide(payload);

      expect(response.body.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.body.message).toBe(
        ErrorMessage.INVALID_END_LATITUDE_LONGITUDE,
      );
      expect(response.status).toBe(400);
    });

    it('should return validation error on riderName', async () => {
      const payload = {
        ...getMockRidePayload(),
        riderName: '',
      };
      const response = await postRide(payload);

      expect(response.body.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.body.message).toBe(ErrorMessage.INVALID_RIDER_NAME);
      expect(response.status).toBe(400);
    });

    it('should return validation error on driverName', async () => {
      const payload = {
        ...getMockRidePayload(),
        driverName: '',
      };
      const response = await postRide(payload);

      expect(response.body.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.body.message).toBe(ErrorMessage.INVALID_DRIVER_NAME);
      expect(response.status).toBe(400);
    });

    it('should return validation error on driverVehicle', async () => {
      const payload = {
        ...getMockRidePayload(),
        driverVehicle: '',
      };
      const response = await postRide(payload);

      expect(response.body.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.body.message).toBe(ErrorMessage.INVALID_VEHICLE_NAME);
      expect(response.status).toBe(400);
    });

    it('should return an unknown error', async () => {
      jest.spyOn(db, 'all').mockImplementationOnce((): Database => {
        throw new Error('something bad happened!');
      });
      const response = await postRide(getMockRidePayload());

      expect(response.body.errorCode).toBe(ErrorCode.SERVER_ERROR);
      expect(response.status).toBe(500);
    });

    it('should return the ride object', async () => {
      const mockData = getMockRidePayload();
      const response = await postRide(mockData);

      expect(response.body).toMatchObject(getMockRides());
      expect(response.status).toBe(201);
    });
  });

  describe('GET /rides/:id', () => {
    it('should return rides not found error', async () => {
      const response = await request(app)
        .get('/rides/1')
        .set('Accept', 'application/json');

      expect(response.body.errorCode).toBe(ErrorCode.RIDES_NOT_FOUND_ERROR);
      expect(response.status).toBe(404);
    });

    it('should return an unknown error', async () => {
      jest.spyOn(db, 'all').mockImplementationOnce((): Database => {
        throw new Error('something bad happened!');
      });
      const response = await request(app)
        .get('/rides/1')
        .set('Accept', 'application/json');

      expect(response.body.errorCode).toBe(ErrorCode.SERVER_ERROR);
      expect(response.status).toBe(500);
    });

    it('should return an array of rides', async () => {
      const mockData = getMockRidePayload();
      await postRide(mockData);
      const response = await request(app)
        .get('/rides/1')
        .set('Accept', 'application/json');

      expect(response.body).toMatchObject(getMockRides()[0]);
      expect(response.status).toBe(200);
    });
  });
});
