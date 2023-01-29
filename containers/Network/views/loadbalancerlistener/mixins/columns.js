import LbListCell from '@Network/views/lb/components/LbListCell'
import { LB_SCHEDULER_MAP } from '@Network/constants/lb'
import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  components: {
    LbListCell,
  },
  computed: {
    columns () {
      const arr = [
        getNameDescriptionTableColumn({
          onManager: this.onManager,
          hideField: true,
          steadyStatus: this.steadyStatus,
          title: i18n.t('network.text_21'),
          slotCallback: row => {
            return (
              <side-page-trigger onTrigger={ () => this.handleOpenSidepage(row) }>{ row.name }</side-page-trigger>
            )
          },
        }),
        getStatusTableColumn({ statusModule: 'lb' }),
        {
          field: 'listener_type&listener_port',
          title: i18n.t('network.text_472'),
          minWidth: 150,
          formatter: ({ row }) => `${row.listener_type}:${row.listener_port}`,
        },
        {
          field: 'scheduler',
          title: i18n.t('network.text_423'),
          minWidth: 100,
          formatter: ({ row }) => {
            if (!row.scheduler || row.redirect === 'raw') return '-'
            const scheduler = LB_SCHEDULER_MAP[row.scheduler]
            return scheduler ? scheduler.text : row.scheduler
          },
        },
        {
          field: 'backend_group',
          title: i18n.t('network.text_139'),
          minWidth: 200,
          slots: {
            default: ({ row }) => {
              return [
                <side-page-trigger onTrigger={ () => this.handleOpenLbbgSidepage(row) }>{ row.backend_group }</side-page-trigger>,
              ]
            },
          },
        },
        getStatusTableColumn({
          minWidth: 100,
          statusModule: 'lbHealth',
          field: 'health_check',
          title: i18n.t('network.text_469'),
          slotCallback: (row) => {
            return row.redirect === 'raw' ? '-' : null
          },
        }),
        getStatusTableColumn({ minWidth: 100, statusModule: 'lbAcl', field: 'acl_status', title: i18n.t('network.text_142') }),
        getStatusTableColumn({ minWidth: 100, statusModule: 'lbRedirect', field: 'redirect', title: i18n.t('network.text_368') }),
      ]
      if (this.data.provider && this.data.provider.toUpperCase() !== 'onecloud') arr.splice(7, 1)
      if (this.data.provider && (this.data.provider.toLowerCase() === 'azure' || this.data.provider.toLowerCase() === 'google')) {
        arr.splice(3, 0, {
          field: 'metadata',
          title: i18n.t('network.text_248'),
          minWidth: 200,
          slots: {
            default: ({ row }) => {
              return row.metadata && row.metadata['ext:FrontendIP'] ? row.metadata['ext:FrontendIP'] : '-'
            },
          },
        })
      }
      return arr
    },
  },
  methods: {
    handleOpenLbbgSidepage (row) {
      this.sidePageTriggerHandle(this, 'LoadbalancerbackendgroupSidePage', {
        id: row.backend_group_id,
        resource: 'loadbalancerbackendgroups',
        lbData: this.data, // this.data 就是 list.vue 里面接收的prop
      }, {
        list: this.list,
      })
    },
  },
}
