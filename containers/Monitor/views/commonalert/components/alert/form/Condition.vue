<template>
  <a-row :gutter="2">
    <a-col :span="4">
      <a-form-item>
        <base-select
          :options="conditionOpts"
          :disabled="disabled"
          :select-props="{ placeholder: $t('common.select') }" />
      </a-form-item>
    </a-col>
    <a-col :span="6">
      <a-form-item>
        <base-select
          v-decorator="decorators.metric_key"
          :options="metricKeyOpts"
          filterable
          :disabled="disabled"
          :item.sync="metricKeyItem"
          :select-props="{ placeholder: $t('monitor.text_112'), loading }"
          @change="metricKeyChange" />
      </a-form-item>
    </a-col>
    <a-col :span="6">
      <a-form-item>
        <base-select
          filterable
          v-decorator="decorators.metric_value"
          :item.sync="metricValueItem"
          :options="metricOpts"
          :labelFormat="metricValueLabelFormat"
          :disabled="disabled"
          @change="metricValueChange"
          :select-props="{ placeholder: $t('monitor.text_113'), allowClear: true, loading }" />
      </a-form-item>
    </a-col>
    <a-col :span="4">
      <a-form-item>
        <base-select v-decorator="decorators.reduce" :options="reduceOpts" :disabled="disabled" minWidth="70px" />
      </a-form-item>
    </a-col>
    <a-col :span="2">
      <a-form-item>
        <base-select v-decorator="decorators.comparator"  :options="comparatorOpts" minWidth="70px" :disabled="disabled" @change="onComparatorChange" />
      </a-form-item>
    </a-col>
    <a-col :span="2" v-show="showThreshold">
      <a-form-item>
        <threshold-input v-decorator="decorators.threshold" :unit="unit" :disabled="disabled"  @change="thresholdChange" />
      </a-form-item>
    </a-col>
  </a-row>
</template>

<script>
import * as R from 'ramda'
import _ from 'lodash'
import { metric_zh } from '@Monitor/constants'
import thresholdInput from './thresholdInput'

export default {
  name: 'AlertCondition',
  components: {
    thresholdInput,
  },
  props: {
    decorators: {
      type: Object,
      required: true,
      validator: val => R.is(Array, val.period) && R.is(Array, val.comparator) && R.is(Array, val.threshold),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    unit: {
      type: String,
      default: '',
    },
    res_type_measurements: {
      type: Object,
      default: () => ({}),
    },
    conditionOpts: {
      type: Array,
      default: () => [
        { key: 'AND', label: 'AND' },
        { key: 'OR', label: 'OR' },
      ],
    },
  },
  inject: ['form'],
  data () {
    let showThreshold = true
    if (this.decorators.comparator[1].initialValue === 'nodata') {
      showThreshold = false
    }
    let threshold
    if (this.decorators.threshold.initialValue) {
      threshold = this.decorators.threshold.initialValue
    }

    return {
      reduceOpts: [
        { key: 'avg', label: this.$t('monitor.avg') },
        { key: 'min', label: this.$t('monitor.min') },
        { key: 'max', label: this.$t('monitor.max') },
      ],
      comparatorOpts: [
        { key: '>=', label: '>=' },
        { key: '<=', label: '<=' },
        { key: '==', label: '==' },
        { key: 'nodata', label: 'No Data' },
      ],
      threshold: { value: threshold, base: 1 },
      showThreshold: showThreshold,
      metric_key: _.get(this.decorators.metric_key, '[1].initialValue'),
      metricValueItem: {},
      metricKeyItem: {},
    }
  },
  computed: {
    metricKeyOpts () {
      return (this.res_type_measurements[this.form.fd.metric_res_type] || []).map(val => {
        let label = val.measurement
        const displayName = val.measurement_display_name
        if (displayName && metric_zh[displayName]) {
          label = metric_zh[displayName]
        }
        return {
          ...val,
          metric_res_type: this.form.fd.metric_res_type,
          key: val.measurement,
          label,
        }
      })
    },
    metricOpts () {
      const metricKeyItem = this.metricKeyOpts.find(item => item.key === this.metric_key)
      if (metricKeyItem && _.isArray(metricKeyItem.field_key)) {
        return metricKeyItem.field_key.map(val => {
          let label = val
          const fieldDes = metricKeyItem.field_descriptions
          let description = {}
          if (fieldDes) {
            description = fieldDes[val]
            const displayName = _.get(fieldDes, `${val}.display_name`)
            if (displayName && metric_zh[displayName]) label = metric_zh[displayName]
          }
          return {
            key: val,
            label,
            description,
            metric_res_type: metricKeyItem.metric_res_type,
          }
        })
      } else {
        return []
      }
    },
  },
  mounted () {
    this.$nextTick(() => {
      const metricValue = this.form.fc.getFieldValue(this.decorators.metric_value[0])
      if (metricValue) this.metricValueChange(metricValue)
    })
  },
  methods: {
    thresholdChange (v) {
      this.$emit('thresholdChange', v)
    },
    onComparatorChange (e) {
      if (e === 'nodata') {
        this.showThreshold = false
      } else {
        this.showThreshold = true
      }
      this.$emit('comparatorChange', e)
    },
    metricValueLabelFormat (item) {
      return (<div>
        {item.label}<span class="text-black-50">({item.description.name})</span>
      </div>)
    },
    metricKeyChange (val, isNative = true) {
      this.metric_key = val
      if (this.form && this.form.fc && isNative) {
        this.form.fc.setFieldsValue({
          [this.decorators.metric_value[0]]: undefined,
        })
      }
    },
    metricValueChange (val) {
      if (!val) {
        this.$emit('metricClear')
      } else {
        let vItem = this.metricValueItem
        let kItem = this.metricKeyItem
        if (!vItem) {
          vItem = this.metricOpts.find((opt) => { return opt.key === val })
        }
        if (this.metricKeyItem) {
          kItem = this.metricKeyOpts.find((opt) => { return opt.key === this.metric_key })
        }
        this.$emit('metricChange', { metricKey: this.metric_key, mertric: val, mertricItem: vItem, metricKeyItem: kItem })
      }
    },
    resetMetric () {
      this.form.fc.setFieldsValue({
        [this.decorators.metric_key[0]]: undefined,
        [this.decorators.metric_value[0]]: undefined,
      })
      this.$emit('metricClear')
    },
  },
}
</script>
