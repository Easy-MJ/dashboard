<template>
  <div>
    <page-header :title="$t('compute.text_92')" :tabs="cloudEnvOptions" :current-tab.sync="cloudEnv">
      <div slot="res-status-tab" style="position: absolute; right: 0; top: 14px;">
        <res-status-tab
          :loading="statisticsLoading"
          :status-opts="statusOpts"
          @click="statusClickHandle" />
      </div>
    </page-header>
    <page-body>
      <baremetal-list
        :id="listId"
        :cloud-env="cloudEnv"
        :filterParams="filterParams"
        @refresh="refreshHandle" />
    </page-body>
  </div>
</template>

<script>
import { getCloudEnvOptions } from '@/utils/common/hypervisor'
import ResStatisticsMixin from '@/mixins/resStatisticsMixin'
import BaremetalList from './components/List'

export default {
  name: 'BaremetalIndex',
  components: {
    BaremetalList,
  },
  mixins: [ResStatisticsMixin],
  data () {
    return {
      listId: 'BaremetalList',
      cloudEnv: '',
      resStaticsResource: 'servers',
    }
  },
  computed: {
    cloudEnvOptions: () => {
      return getCloudEnvOptions('compute_engine_brands').filter(item => item.key !== 'public')
    },
  },
}
</script>
