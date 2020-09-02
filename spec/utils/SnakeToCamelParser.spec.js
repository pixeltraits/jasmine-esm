process.env.NODE_ENV = 'test';
import SnakeToCamelParser from '../../utils/snakeToCamelParser.js';

describe('SnakeToCamelParser', () => {

  describe('parse should', () => {

    it('call parseArray if argument is an array', () => {
      const argumentData = [];
      spyOn(SnakeToCamelParser, 'parseArray');

      SnakeToCamelParser.parse(argumentData);

      expect(SnakeToCamelParser.parseArray).toHaveBeenCalled();
    });

    it('call parseObject if argument is an object', () => {
      const argumentData = {};
      spyOn(SnakeToCamelParser, 'parseObject');

      SnakeToCamelParser.parse(argumentData);

      expect(SnakeToCamelParser.parseObject).toHaveBeenCalled();
    });

    it('return date if argument is a date', () => {
      const argumentData = new Date();

      const result = SnakeToCamelParser.parse(argumentData);

      expect(result).toEqual(argumentData);
    });

    it('return null if argument is a null', () => {
      const argumentData = null;

      const result = SnakeToCamelParser.parse(argumentData);

      expect(result).toEqual(argumentData);
    });

  });

  describe('parseArray should', () => {

    it('camelcasify an array', () => {
      const noCamelArray = [
        {
          banjo_kazooie: {
            test_gruntilda: null
          },
          champion_du_monde: 0
        },
        {
          jaime_les_licornes: ['portal', 'stalker', 'metro'],
          born_to_be_alive: {
            test_aperture: false
          },
          jaime_les_gateaux: true
        }
      ];

      const expected = [
        {
          banjoKazooie: {
            testGruntilda: null
          },
          championDuMonde: 0
        },
        {
          jaimeLesLicornes: ['portal', 'stalker', 'metro'],
          bornToBeAlive: {
            testAperture: false
          },
          jaimeLesGateaux: true
        }
      ];

      expect(SnakeToCamelParser.parseArray(noCamelArray)).toEqual(expected);
    });
  });

  describe('parseObject should', () => {

    it('camelcasify an object', () => {
      const noCamelObject = {
        nintendo_64: {
          banjo_kazooie: { test_gruntilda: false },
          champion_du_monde: 0
        },
        geforce_8700: {
          jaime_les_licornes: ['portal', 'stalker', 'metro'],
          born_to_be_alive: { test_aperture: false },
          jaime_les_gateaux: true
        }
      };

      const expected = {
        nintendo64: {
          banjoKazooie: {
            testGruntilda: false
          },
          championDuMonde: 0
        },
        geforce8700: {
          jaimeLesLicornes: ['portal', 'stalker', 'metro'],
          bornToBeAlive: {
            testAperture: false
          },
          jaimeLesGateaux: true
        }
      };

      expect(SnakeToCamelParser.parseObject(noCamelObject)).toEqual(expected);
    });

  });

});
