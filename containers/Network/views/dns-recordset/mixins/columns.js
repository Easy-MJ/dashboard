import {
  getNameDescriptionTableColumn,
  getEnabledTableColumn,
  getTagTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'
import {
  getDnsTypeTableColumns,
  getDnsValueTableColumns,
  getTrafficPoliciesTableColumns,
  getTtlTableColumns,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        title: i18n.t('common_664'),
        edit: false,
        formRules: function (row) {
          return [
            { required: true, message: i18n.t('network.text_173') },
          ]
        },
        slotCallback: row => {
          return (
            <side-page-trigger onTrigger={ () => this.handleOpenSidepage(row) }>{ row.name }</side-page-trigger>
          )
        },
      }),
      getEnabledTableColumn(),
      getTagTableColumn({ onManager: this.onManager, needExt: true, resource: 'dns_recordsets', columns: () => this.columns }),
      getDnsTypeTableColumns(),
      getDnsValueTableColumns(),
      getTrafficPoliciesTableColumns(),
      getTtlTableColumns(),
      {
        title: i18n.t('network.owner_dns_zone'),
        field: 'dns_zone',
      },
    ]
  },
}
