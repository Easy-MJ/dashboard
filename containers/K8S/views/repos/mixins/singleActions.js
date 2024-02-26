import { getSetPublicAction } from '@/utils/common/tableActions'

export default {
  created () {
    this.singleActions = [
      {
        label: this.$t('table.action.delete'),
        permission: 'k8s_container_registries_delete',
        action: obj => {
          this.createDialog('DeleteResDialog', {
            vm: this,
            data: [obj],
            columns: this.columns,
            title: this.$t('table.action.delete'),
            name: this.$t('k8s.text_158'),
            onManager: this.onManager,
          })
        },
        meta: obj => this.$getDeleteResult(obj),
      },
      getSetPublicAction(this, {
        name: this.$t('k8s.text_158'),
        scope: 'domain',
        resource: 'container_registries',
        apiVersion: 'v1',
      }, {
        permission: 'k8s_container_registries_public',
      }),
    ]
  },
}
