import app from './app'

describe('app', () => {

  describe('AppCtrl', () => {
    let ctrl

    beforeEach(() => {
      angular.mock.module(app)

      angular.mock.inject(($controller) => {
        ctrl = $controller('AppCtrl', {})
      })
    })

    describe('private helpers', () => {

      // do we really need to test private helpers since they should be covered by other tests? perhaps not
      // but just in case... here we are!
      it('should update "last" values properly', () => {
        expect(ctrl.lastValue).toBeNull
        expect(ctrl.lastOperation).toBeNull
        ctrl._updateLast('1', '+')
        expect(ctrl.lastValue).toBe('1')
        expect(ctrl.lastOperation).toBe('+')
        ctrl._updateLast('2')
        expect(ctrl.lastValue).toBe('2')
        expect(ctrl.lastOperation).toBeNull
        ctrl._updateLast()
        expect(ctrl.lastValue).toBeNull
        expect(ctrl.lastOperation).toBeNull
      })

      it('should update "pending" values properly', () => {
        expect(ctrl.pendingValue).toBeNull
        expect(ctrl.pendingOperation).toBeNull
        ctrl._updatePending('1', '+')
        expect(ctrl.pendingValue).toBe('1')
        expect(ctrl.pendingOperation).toBe('+')
        ctrl._updatePending('2')
        expect(ctrl.pendingValue).toBe('2')
        expect(ctrl.pendingOperation).toBeNull
        ctrl._updatePending()
        expect(ctrl.pendingValue).toBeNull
        expect(ctrl.pendingOperation).toBeNull
      })

      it('should calculate values properly', () => {
        expect(ctrl._calculate('+', '5', '6')).toBe('11')
        expect(ctrl._calculate('-', '1000', '988')).toBe('12')
        expect(ctrl._calculate('*', '6.5', '2')).toBe('13')
        expect(ctrl._calculate('/', '56', '4')).toBe('14')
      })
    })

    it('should start with the default state', () => {
      expect(ctrl.lastValue).toBeNull
      expect(ctrl.lastOperation).toBeNull
      expect(ctrl.currentValue).toBe('0')
      expect(ctrl.pendingValue).toBeNull
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.justSelectedOperator).toBe(false)
      expect(ctrl.justUpdatedTotal).toBe(false)
    })

    it('should properly update current value from default state', () => {
      ctrl.enterValue('1')
      expect(ctrl.currentValue).toBe('1')

      ctrl.enterValue('2')
      expect(ctrl.currentValue).toBe('12')

      ctrl.enterValue('3')
      expect(ctrl.currentValue).toBe('123')
    })

    it('should properly update current value with decimal from default state', () => {
      ctrl.enterValue('1')
      expect(ctrl.currentValue).toBe('1')

      ctrl.enterDecimal()
      expect(ctrl.currentValue).toBe('1.')

      ctrl.enterValue('2')
      expect(ctrl.currentValue).toBe('1.2')

      ctrl.enterValue('3')
      expect(ctrl.currentValue).toBe('1.23')
    })

    it('should only register one decimal', () => {
      ctrl.enterValue('1')
      expect(ctrl.currentValue).toBe('1')

      ctrl.enterDecimal()
      expect(ctrl.currentValue).toBe('1.')

      ctrl.enterDecimal()
      expect(ctrl.currentValue).toBe('1.')

      ctrl.enterValue('2')
      expect(ctrl.currentValue).toBe('1.2')

      ctrl.enterDecimal()
      expect(ctrl.currentValue).toBe('1.2')

      ctrl.enterDecimal()
      expect(ctrl.currentValue).toBe('1.2')

      ctrl.enterValue('3')
      ctrl.enterDecimal()
      ctrl.enterDecimal()
      ctrl.enterDecimal()
      ctrl.enterDecimal()
      ctrl.enterDecimal()
      expect(ctrl.currentValue).toBe('1.23')
    })

    it('should properly handle addition calculations', () => {
      ctrl.enterValue('1')
      expect(ctrl.currentValue).toBe('1')

      ctrl.enterOperator('+')
      expect(ctrl.currentValue).toBe('1')
      expect(ctrl.pendingOperation).toBe('+')

      ctrl.enterValue('2')
      expect(ctrl.currentValue).toBe('2')
      expect(ctrl.pendingOperation).toBe('+')
      expect(ctrl.pendingValue).toBe('1')

      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('3')
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.pendingValue).toBe('3')
      expect(ctrl.lastValue).toBe('2')
      expect(ctrl.lastOperation).toBe('+')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(false)

      // couple more tests with some larger numbers
      // NOTE: here, and in similar sections below, we also happen to be testing that
      // starting a new calculation automatically clears out any previous result from the display
      ctrl.enterValue('4')
      ctrl.enterValue('9')
      ctrl.enterOperator('+')
      ctrl.enterValue('6')
      ctrl.enterValue('7')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('116')

      ctrl.enterValue('1')
      ctrl.enterValue('0')
      ctrl.enterValue('1')
      ctrl.enterOperator('+')
      ctrl.enterValue('2')
      ctrl.enterValue('0')
      ctrl.enterValue('2')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('303')
    })

    it('should properly handle addition continuation calculations', () => {
      // typing a new operator after entering a calculation without pressing "=" first should
      // go ahead and calculate and display the result
      ctrl.enterValue('1')
      ctrl.enterOperator('+')
      ctrl.enterValue('2')
      ctrl.enterOperator('+')
      expect(ctrl.currentValue).toBe('3')
      expect(ctrl.pendingOperation).toBe('+')
      expect(ctrl.pendingValue).toBe('3')
      expect(ctrl.lastValue).toBe('2')
      expect(ctrl.lastOperation).toBe('+')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(true)

      ctrl.enterValue('4')
      expect(ctrl.currentValue).toBe('4')
      expect(ctrl.justUpdatedTotal).toBe(false)

      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('7')
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.pendingValue).toBe('7')
      expect(ctrl.lastValue).toBe('4')
      expect(ctrl.lastOperation).toBe('+')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(false)
    })

    it('should properly handle subtraction calculations', () => {
      ctrl.enterValue('1')
      ctrl.enterValue('0')
      expect(ctrl.currentValue).toBe('10')

      ctrl.enterOperator('-')
      expect(ctrl.currentValue).toBe('10')
      expect(ctrl.pendingOperation).toBe('-')

      ctrl.enterValue('1')
      expect(ctrl.currentValue).toBe('1')
      expect(ctrl.pendingOperation).toBe('-')
      expect(ctrl.pendingValue).toBe('10')

      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('9')
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.pendingValue).toBe('9')
      expect(ctrl.lastValue).toBe('1')
      expect(ctrl.lastOperation).toBe('-')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(false)

      // a couple more with larger numbers
      ctrl.enterValue('6')
      ctrl.enterValue('6')
      expect(ctrl.currentValue).toBe('66')
      ctrl.enterOperator('-')
      ctrl.enterValue('3')
      ctrl.enterValue('7')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('29')

      ctrl.enterValue('3')
      ctrl.enterValue('1')
      ctrl.enterValue('2')
      expect(ctrl.currentValue).toBe('312')
      ctrl.enterOperator('-')
      ctrl.enterValue('1')
      ctrl.enterValue('2')
      ctrl.enterValue('2')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('190')
    })

    it('should properly handle subtraction continuation calculations', () => {
      ctrl.enterValue('1')
      ctrl.enterValue('0')
      ctrl.enterOperator('-')
      ctrl.enterValue('1')
      ctrl.enterOperator('-')
      expect(ctrl.currentValue).toBe('9')
      expect(ctrl.pendingOperation).toBe('-')
      expect(ctrl.pendingValue).toBe('9')
      expect(ctrl.lastValue).toBe('1')
      expect(ctrl.lastOperation).toBe('-')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(true)

      ctrl.enterValue('2')
      expect(ctrl.currentValue).toBe('2')
      expect(ctrl.justUpdatedTotal).toBe(false)

      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('7')
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.pendingValue).toBe('7')
      expect(ctrl.lastValue).toBe('2')
      expect(ctrl.lastOperation).toBe('-')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(false)
    })

    it('should properly handle multiplication calculations', () => {
      ctrl.enterValue('2')
      expect(ctrl.currentValue).toBe('2')

      ctrl.enterOperator('*')
      expect(ctrl.currentValue).toBe('2')
      expect(ctrl.pendingOperation).toBe('*')

      ctrl.enterValue('3')
      expect(ctrl.currentValue).toBe('3')
      expect(ctrl.pendingOperation).toBe('*')
      expect(ctrl.pendingValue).toBe('2')

      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('6')
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.pendingValue).toBe('6')
      expect(ctrl.lastValue).toBe('3')
      expect(ctrl.lastOperation).toBe('*')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(false)

      // a couple more with larger numbers
      ctrl.enterValue('1')
      ctrl.enterValue('0')
      expect(ctrl.currentValue).toBe('10')
      ctrl.enterOperator('*')
      ctrl.enterValue('1')
      ctrl.enterValue('0')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('100')

      ctrl.enterValue('1')
      ctrl.enterValue('2')
      ctrl.enterValue('3')
      expect(ctrl.currentValue).toBe('123')
      ctrl.enterOperator('*')
      ctrl.enterValue('4')
      ctrl.enterValue('5')
      ctrl.enterValue('6')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('56088')
    })

    it('should properly handle multiplication continuation calculations', () => {
      ctrl.enterValue('2')
      ctrl.enterOperator('*')
      ctrl.enterValue('3')
      ctrl.enterOperator('*')
      expect(ctrl.currentValue).toBe('6')
      expect(ctrl.pendingOperation).toBe('*')
      expect(ctrl.pendingValue).toBe('6')
      expect(ctrl.lastValue).toBe('3')
      expect(ctrl.lastOperation).toBe('*')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(true)

      ctrl.enterValue('4')
      expect(ctrl.currentValue).toBe('4')
      expect(ctrl.justUpdatedTotal).toBe(false)

      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('24')
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.pendingValue).toBe('24')
      expect(ctrl.lastValue).toBe('4')
      expect(ctrl.lastOperation).toBe('*')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(false)
    })

    it('should properly handle division calculations', () => {
      ctrl.enterValue('1')
      ctrl.enterValue('8')
      expect(ctrl.currentValue).toBe('18')

      ctrl.enterOperator('/')
      expect(ctrl.currentValue).toBe('18')
      expect(ctrl.pendingOperation).toBe('/')

      ctrl.enterValue('3')
      expect(ctrl.currentValue).toBe('3')
      expect(ctrl.pendingOperation).toBe('/')
      expect(ctrl.pendingValue).toBe('18')

      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('6')
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.pendingValue).toBe('6')
      expect(ctrl.lastValue).toBe('3')
      expect(ctrl.lastOperation).toBe('/')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(false)

      // a couple more with larger numbers
      ctrl.enterValue('9')
      ctrl.enterValue('9')
      expect(ctrl.currentValue).toBe('99')
      ctrl.enterOperator('/')
      ctrl.enterValue('1')
      ctrl.enterValue('1')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('9')

      ctrl.enterValue('3')
      ctrl.enterValue('2')
      ctrl.enterValue('0')
      expect(ctrl.currentValue).toBe('320')
      ctrl.enterOperator('/')
      ctrl.enterValue('3')
      ctrl.enterValue('2')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('10')
    })

    it('should properly handle division continuation calculations', () => {
      ctrl.enterValue('1')
      ctrl.enterValue('8')
      ctrl.enterOperator('/')
      ctrl.enterValue('3')
      ctrl.enterOperator('/')
      expect(ctrl.currentValue).toBe('6')
      expect(ctrl.pendingOperation).toBe('/')
      expect(ctrl.pendingValue).toBe('6')
      expect(ctrl.lastValue).toBe('3')
      expect(ctrl.lastOperation).toBe('/')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(true)

      ctrl.enterValue('2')
      expect(ctrl.currentValue).toBe('2')
      expect(ctrl.justUpdatedTotal).toBe(false)

      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('3')
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.pendingValue).toBe('3')
      expect(ctrl.lastValue).toBe('2')
      expect(ctrl.lastOperation).toBe('/')
      expect(ctrl.justUpdatedTotal).toBe(true)
      expect(ctrl.justSelectedOperator).toBe(false)
    })

    it('should properly handle calculations with decimals', () => {
      ctrl.enterValue('1')
      ctrl.enterValue('0')
      ctrl.enterDecimal()
      ctrl.enterValue('3')
      expect(ctrl.currentValue).toBe('10.3')

      ctrl.enterOperator('+')
      ctrl.enterValue('2')
      ctrl.enterDecimal()
      ctrl.enterValue('5')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('12.8')

      ctrl.enterValue('2')
      ctrl.enterValue('1')
      ctrl.enterDecimal()
      ctrl.enterValue('6')
      expect(ctrl.currentValue).toBe('21.6')

      ctrl.enterOperator('-')
      ctrl.enterValue('1')
      ctrl.enterDecimal()
      ctrl.enterValue('6')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('20')

      ctrl.enterValue('1')
      ctrl.enterValue('0')
      ctrl.enterDecimal()
      ctrl.enterValue('8')
      expect(ctrl.currentValue).toBe('10.8')

      ctrl.enterOperator('/')
      ctrl.enterValue('2')
      ctrl.enterOperator('/')
      expect(ctrl.currentValue).toBe('5.4')

      ctrl.enterValue('2')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('2.7')
    })

    it('should properly clear values', () => {
      ctrl.enterValue('1')
      expect(ctrl.currentValue).toBe('1')
      ctrl.clear()
      expect(ctrl.lastValue).toBeNull
      expect(ctrl.lastOperation).toBeNull
      expect(ctrl.currentValue).toBe('0')
      expect(ctrl.pendingValue).toBeNull
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.justSelectedOperator).toBe(false)
      expect(ctrl.justUpdatedTotal).toBe(false)

      ctrl.enterValue('1')
      ctrl.enterValue('0')
      ctrl.enterValue('0')
      expect(ctrl.currentValue).toBe('100')
      ctrl.clear()
      expect(ctrl.lastValue).toBeNull
      expect(ctrl.lastOperation).toBeNull
      expect(ctrl.currentValue).toBe('0')
      expect(ctrl.pendingValue).toBeNull
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.justSelectedOperator).toBe(false)
      expect(ctrl.justUpdatedTotal).toBe(false)

      ctrl.enterValue('1')
      ctrl.enterValue('2')
      ctrl.enterValue('3')
      ctrl.enterValue('4')
      ctrl.enterValue('5')
      expect(ctrl.currentValue).toBe('12345')
      ctrl.clear()
      expect(ctrl.lastValue).toBeNull
      expect(ctrl.lastOperation).toBeNull
      expect(ctrl.currentValue).toBe('0')
      expect(ctrl.pendingValue).toBeNull
      expect(ctrl.pendingOperation).toBeNull
      expect(ctrl.justSelectedOperator).toBe(false)
      expect(ctrl.justUpdatedTotal).toBe(false)

      ctrl.enterValue('1')
      ctrl.enterValue('2')
      ctrl.clear()
      ctrl.enterValue('3')
      ctrl.enterValue('4')
      expect(ctrl.currentValue).toBe('34')
    })

    it('should show the proper number of digits of precision', () => {
      ctrl.enterValue('1')
      ctrl.enterDecimal()
      ctrl.enterValue('2')
      ctrl.enterValue('3')
      ctrl.enterValue('4')
      ctrl.enterOperator('*')
      ctrl.enterValue('2')
      ctrl.enterDecimal()
      ctrl.enterValue('3')
      ctrl.enterValue('4')
      ctrl.enterValue('5')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('2.8937')

      ctrl.enterValue('1')
      ctrl.enterDecimal()
      ctrl.enterValue('2')
      ctrl.enterValue('3')
      ctrl.enterValue('4')
      ctrl.enterValue('5')
      ctrl.enterValue('6')
      ctrl.enterValue('7')
      ctrl.enterValue('8')
      ctrl.enterValue('9')
      ctrl.enterOperator('+')
      ctrl.enterValue('1')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBe('2.2346')
    })

    it('should show NaN for division by zero', () => {
      ctrl.enterValue('1')
      ctrl.enterOperator('/')
      ctrl.enterValue('0')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBeNaN

      ctrl.enterValue('5')
      ctrl.enterValue('6')
      ctrl.enterOperator('/')
      ctrl.enterValue('0')
      ctrl.calculateTotal()
      expect(ctrl.currentValue).toBeNaN
    })
  })
})
