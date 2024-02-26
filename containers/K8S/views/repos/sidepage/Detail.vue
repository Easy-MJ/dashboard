<template>
  <detail
    :onManager="onManager"
    :data="data"
    :base-info="baseInfo"
    :extra-info="extraInfo"
    :hiddenKeys="['zone', 'region', 'project_domain']"
    resource="container_registries"
    statusModule="k8s_repo" />
</template>

<script>
import {
  getPublicScopeTableColumn,
} from '@/utils/common/tableColumn'
import {
  getUrlTableColumn,
} from '../utils/columns'

export default {
  name: 'K8sReposDetail',
  props: {
    data: {
      type: Object,
      required: true,
    },
    onManager: {
      type: Function,
      required: true,
    },
  },
  data () {
    return {
      baseInfo: [
        getUrlTableColumn(),
        getPublicScopeTableColumn({ vm: this, resource: 'container_registries' }),
      ],
    }
  },
}
</script>
