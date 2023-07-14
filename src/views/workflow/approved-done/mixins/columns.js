import { WORKFLOW_TYPES } from '@/constants/workflow'
import {
  getCopyWithContentTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'
import {
  getProcessDefinitionNameTableColumn,
  internalResourceColumns,
} from '../../utils/columns'
const R = require('ramda')

export default {
  created () {
    this.columns = [
      getCopyWithContentTableColumn({
        field: 'process_instance_id',
        title: i18n.t('common_350'),
        minWidth: 80,
        hideField: true,
        onManager: this.onManager,
        slotCallback: row => {
          return (
            <side-page-trigger onTrigger={ () => this.handleOpenSidepage(row) }>{ row.process_instance_id }</side-page-trigger>
          )
        },
      }),
      getProcessDefinitionNameTableColumn({ field: 'process_instance.process_definition_name' }),
      ...internalResourceColumns(),
      {
        field: 'initiator',
        title: i18n.t('common_371'),
        minWidth: 80,
        showOverflow: 'title',
        formatter: ({ cellVal, row }) => {
          return row.process_instance?.start_user_displayname || row.process_instance?.start_user_name
        },
      },
      {
        field: 'state',
        title: i18n.t('common_372'),
        minWidth: 80,
        showOverflow: 'title',
        formatter: ({ row }) => {
          if (row.process_definition_key === WORKFLOW_TYPES.CUSTOMER_SERVICE) {
            if (row.variables.satisfied) {
              return this.$t('common.pass')
            }
            return this.$t('common.pending')
          }
          if (R.isNil(row.local_variables) || R.isEmpty(row.local_variables)) return '-'
          if (row.local_variables.approved) {
            return this.$t('common.pass')
          }
          return this.$t('common.reject')
        },
        slots: {
          default: ({ row }, h) => {
            if (row.process_definition_key === WORKFLOW_TYPES.CUSTOMER_SERVICE) {
              if (row.variables.satisfied) {
                return [
                  <span style="color: #7ed321;">{this.$t('common.pass')}</span>,
                ]
              }
              return [
                <span style="color: #f6a100;">{this.$t('common.pending')}</span>,
              ]
            }
            if (R.isNil(row.local_variables) || R.isEmpty(row.local_variables)) return '-'
            if (row.local_variables.approved) {
              return [
                <span style="color: #7ed321;">{this.$t('common.pass')}</span>,
              ]
            }
            return [
              <span style="color: rgba(240, 61, 61, 1);">{this.$t('common.reject')}</span>,
            ]
          },
        },
      },
      getTimeTableColumn({ field: 'start_time', title: i18n.t('common_374') }),
      getTimeTableColumn({ field: 'end_time', title: i18n.t('common_387') }),
    ]
  },
}
