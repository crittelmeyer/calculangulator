import angular from 'angular'

import '../style/app.css'

const PRECISION = 4

let app = () => {
  return {
    template: require('./app.html'),
    controller: 'AppCtrl',
    controllerAs: 'app'
  }
}

class AppCtrl {
  constructor() {
    this.clear()
  }

  clear() {
    this.lastValue = null
    this.lastOperation = null
    this.currentValue = '0'
    this.pendingValue = null
    this.pendingOperation = null
    this.justSelectedOperator = false
    this.justUpdatedTotal = false
  }

  enterValue(value) {
    if (this.currentValue === '0' || this.justSelectedOperator || this.justUpdatedTotal) {
      this.currentValue = value
      this.justSelectedOperator = false
      this.justUpdatedTotal = false
      this._updateLast()
    } else {
      this.currentValue = this.currentValue + value
    }
  }

  enterDecimal() {
    if (this.justSelectedOperator || this.justUpdatedTotal) {
      this.currentValue = '0'
      this.justSelectedOperator = false
      this.justUpdatedTotal = false
      this._updateLast()
    }

    if (this.currentValue.indexOf('.') === -1) {
      this.currentValue = this.currentValue + '.'
    }
  }

  enterOperator(operator) {
    this.justSelectedOperator = true
    if (this.pendingOperation === null) {
      this.pendingOperation = operator
      this.pendingValue = this.currentValue
    } else {
      if (this.pendingValue && this.currentValue) {
        this.pendingOperation = operator
        this._updateTotal()
      }
    }
  }

  calculateTotal() {
    if (this.justUpdatedTotal) {
      this.currentValue = this._calculate(this.lastOperation, this.lastValue, this.currentValue)

      this.pendingValue = this.currentValue
    }

    if (this.pendingValue && this.pendingOperation && this.currentValue) {
      this._updateTotal()
    }
  }

  _updateLast(replaceValue = null, replaceOperation = null) {
    this.lastValue = replaceValue
    this.lastOperation = replaceOperation
  }

  _updatePending(replaceValue = null, replaceOperation = null) {
    this.pendingValue = replaceValue
    this.pendingOperation = replaceOperation
  }

  _updateTotal() {
    this._updateLast(this.currentValue, this.pendingOperation)
    this.currentValue = this._calculate(this.pendingOperation, this.pendingValue, this.currentValue)
    this._updatePending(this.currentValue, this.justSelectedOperator ? this.pendingOperation : null)
    this.justUpdatedTotal = true
  }

  _calculate(operator, operand1, operand2) {
    let result
    switch (operator) {
      case '+':
        result = parseFloat(operand1) + parseFloat(operand2)
        break
      case '-':
        result = parseFloat(operand1) - parseFloat(operand2)
        break
      case '*':
        result = parseFloat(operand1) * parseFloat(operand2)
        break
      case '/':
        result = parseFloat(operand1) / parseFloat(operand2)
        break
    }

    if (isFinite(result)) {
      // eh, this line is a little awkward, but simple enough
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

angular.module(MODULE_NAME, [])
  .directive('app', app)
  .controller('AppCtrl', AppCtrl)

export default MODULE_NAME
