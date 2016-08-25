import angular from 'angular'

import '../style/app.css'


/**
 * The digits of precision we want to display to the user
 * NOTE: in the current implementation, we put no precision restrictions on the numbers
 * subitted by the user - only on the calculated result.
 */
const PRECISION = 4


/**
 * Operator string values
 * @enum {string}
 */
const OPERATOR = {
  PLUS: '+',
  MINUS: '-',
  MULTIPLY: "*",
  DIVIDE: "/"
}


/**
 * The primary application directive
 */
let app = () => {
  return {
    template: require('./app.html'),
    controller: 'AppCtrl',
    controllerAs: 'app'
  }
}


/**
 * The primary application controller
 */
class AppCtrl {
  constructor() {
    // initialize our state variables
    this.clear()
  }


  /**
   * clear - Resets all state variables to initial values
   */
  clear() {

    // currentValue is the value shown on the main display
    // it displays any recently entered operands by the user
    // as well as the running total of completed calculations (which can be fed into subsequent calculations)
    this.currentValue = '0'

    // lastValue stores the most recently executed operand by the user
    // lastOperator stores the most recently executed operator by the user
    // storing these allows us to enable the user to quickly apply the most recently
    // used operator & the most recently used operand to our currentValue
    // for instance: 1 + 2 =
    // will display: 3 (3 is our currentValue)
    // and will store "2" as the lastValue & "+" as the lastOperator
    // now, if the user presses "=" again, we can easily apply "+ 2" to our new currentValue (3),
    // displaying: 5
    this.lastValue = null
    this.lastOperator = null

    // pendingValue and pendingOperator stores the operand and operator
    // that will next be used along with currentValue to calculate our
    // running total (and thus, our new currentValue)
    // for instance: 1 + 2
    // will result in a pendingValue of "1", a pendingOperator of "+", and a currentValue of "2"
    // pressing "=" now allows us to apply pendingOperator to pendingValue and currentValue to
    // produce our result (and thus, our new currentValue). Also, since we support using a previous
    // result as the basis for the next calculation, we can store the newly calculated currentValue
    // in pendingValue, prepping the stage for a new calculation using our running total as one of
    // the operands
    this.pendingValue = null
    this.pendingOperator = null

    // we also support continuous operations that display running totals without needing to press "="
    // to see the result of the most recent calculation
    // for instance: 1 + 2 +
    // will both display "3" as the result AND prep the state for the next calculation
    // to help determine whether or not submitting an operand by the user should be
    // immediately calculated and displayed, justSelectedOperator keeps track of whether
    // the most recent user action was enterOperator()
    // NOTE: it could be argued that always storing the most recent action performed by the user
    // in a variable such as "lastUserAction" would be better than having a super-specific
    // justSelectedOperator variable. This would be especially useful if our calculator implementation
    // was more robust and we had more uses for storing the most recently entered action. But, in this
    // case, justSelectedOperator works fine and is fairly readable
    this.justSelectedOperator = false

    // once a user has performed a calculation and the result is displayed on screen, the user may
    // decide to start entering a brand new calculation right away, without first pressing "C" to clear
    // the display. We should be able to recognize this and clear the display for the user (rather than
    // erroneously appending the new operands to the calculated result)
    // the justUpdatedTotal variable helps us keep track of whether or not a submitted digit/decimal
    // should be considered a brand new number (and thus the screen should be cleared) or should be
    // appended to the current display as a continuation of that value
    // for instance, if the user presses "3" and then "4", we would see "34" on the display
    // however, if the user enters: 1 + 2 =
    // the screen will display "3", after which if the user enters "4" we should NOT see "34",
    // but rather just "4", since this is the start of the next calculation
    this.justUpdatedTotal = false
  }

  /**
   * enterValue - Accepts a digit value submitted by the user and updates the currentValue and
   * other variables appropriately
   *
   * @param  {string} value The digit submitted by the user
   */
  enterValue(value) {
    if (this.currentValue === '0' || this.justSelectedOperator || this.justUpdatedTotal) {
      // when the currentValue is set to its default (0), or if the user has either just
      // selected an operator or just updated the total, we want to completely replace currentValue
      this.currentValue = value

      // clear out our helper bits, as well as any "last" values we had stored
      // (executing _updateLast with no arguments will clear the values)
      this.justSelectedOperator = false
      this.justUpdatedTotal = false
      this._updateLast()
    } else {

      // otherwise, we should append
      this.currentValue = this.currentValue + value
    }
  }

  /**
   * enterDecimal - Appends a decimal to the currentValue if no other decimals are already present
   */
  enterDecimal() {
    if (this.justSelectedOperator || this.justUpdatedTotal) {
      // reset the currentValue to "0", so that the display will show "0." instead of just a decimal "."
      this.currentValue = '0'

      // clear out our helper bits, as well as any "last" values we had stored
      // (executing _updateLast with no arguments will clear the values)
      // These three lines are also used above, so we could create a function to be DRYer
      // but an obvious name for that function doesn't jump at me, so I'm reluctant to create one,
      // especially since these lines only appear these two times
      this.justSelectedOperator = false
      this.justUpdatedTotal = false
      this._updateLast()
    }

    // check for existing decimals, and if there are none, append one
    if (this.currentValue.indexOf('.') === -1) {
      this.currentValue = this.currentValue + '.'
    }
  }

  /**
   * enterOperator - accepts an arithmetic operator and stores it in preparation for a future
   * calculation. If a previous calculation is already pending, it will execute that calculation first
   *
   * @param  {OPERATOR} operator Arithmetic operator (+ - / *)
   */
  enterOperator(operator) {
    // set our helper flag
    this.justSelectedOperator = true

    // we don't have a previous operator stored, so just set our "pending" vars as per normal
    if (this.pendingOperator === null) {
      this.pendingOperator = operator
      this.pendingValue = this.currentValue
    } else {
      if (this.pendingValue && this.currentValue) {
        // we have a previous operator stored, and we have two operands to work with, so we should
        // treat this action as both a standard operator entry AND a call to perform a calculation
        this.pendingOperator = operator
        this._updateTotal()
      }
    }
  }

  /**
   * calculateTotal - Calculates the running total and displays it to the screen
   */
  calculateTotal() {
    if (this.justUpdatedTotal) {
      // looks like we pressed "=" again right after a previous "=", so we should apply
      // the lastValue and lastOperator to our newly calculated currentValue
      this.currentValue = this._calculate(this.lastOperator, this.lastValue, this.currentValue)

      // store new currentValue in pendingValue for future calculations
      this.pendingValue = this.currentValue
    }

    // calculate and display the new currentValue
    if (this.pendingValue && this.pendingOperator && this.currentValue) {
      this._updateTotal()
    }
  }

  /**
   * _updateLast - Helper function for updating lastValue and lastOperator
   *
   * @param  {string} replaceValue = null     The value which will replace the existing lastValue
   * @param  {OPERATOR} replaceOperator = null The operator which will replace the existing lastOperator
   */
  _updateLast(replaceValue = null, replaceOperator = null) {
    this.lastValue = replaceValue
    this.lastOperator = replaceOperator
  }

  /**
   * _updatePending - Helper function for updating pendingValue and pendingOperator
   *
   * @param  {type} replaceValue = null    The value which will replace the existing pendingValue
   * @param  {type} replaceOperator = null The operator which will replace the existing pendingOperator
   */
  _updatePending(replaceValue = null, replaceOperator = null) {
    this.pendingValue = replaceValue
    this.pendingOperator = replaceOperator
  }

  /**
   * _updateTotal - Helper function for updating currentValue with the new calculation result
   * and appropriately updating other state variables
   */
  _updateTotal() {
    this._updateLast(this.currentValue, this.pendingOperator)
    this.currentValue = this._calculate(this.pendingOperator, this.pendingValue, this.currentValue)
    this._updatePending(this.currentValue, this.justSelectedOperator ? this.pendingOperator : null)
    this.justUpdatedTotal = true
  }

  /**
   * _calculate - Helper function for calculating a given problem by applying an operator to two operands
   *
   * @param  {OPERATOR} operator The operator which will be applied to the calculation
   * @param  {type} operand1 The first operand in our calculation
   * @param  {type} operand2 The second operand in our calculation
   * @return {string|NaN}          The newly calculated value
   */
  _calculate(operator, operand1, operand2) {
    let result

    // NOTE: we could make this DRYer by abstracting out the repetitive logic below,
    // but this is extremely readable and I don't mind it :)
    switch (operator) {
      case OPERATOR.PLUS:
        result = parseFloat(operand1) + parseFloat(operand2)
        break
      case OPERATOR.MINUS:
        result = parseFloat(operand1) - parseFloat(operand2)
        break
      case OPERATOR.MULTIPLY:
        result = parseFloat(operand1) * parseFloat(operand2)
        break
      case OPERATOR.DIVIDE:
        result = parseFloat(operand1) / parseFloat(operand2)
        break
    }

    // in JS float arithmetic, a division by zero (n/0) is essentially interpreted as
    // "the limit of n as the denominator approaches 0", which results in Infinity
    // here, we override that logic to display NaN for division by zero
    // NOTE: using the handy isFinite function allows us to check for both Infinity and -Infinity
    // in one fell swoop
    if (isFinite(result)) {
      // eh, this line is a little awkward, but simple enough to understand
      // toFixed gives us the precision we want, but also pads with zeroes
      // parseFloat gets rid of the zeroes
      // toString turns it back into a string
      return parseFloat(result.toFixed(PRECISION)).toString()
    } else {
      return NaN
    }
  }
}

const MODULE_NAME = 'app'

// create our angular module and initialize the app directive and AppCtrl controller
angular.module(MODULE_NAME, [])
  .directive('app', app)
  .controller('AppCtrl', AppCtrl)

export default MODULE_NAME
