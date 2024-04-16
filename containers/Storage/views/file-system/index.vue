<template>
  <div>
    <page-header
      :title="$t('dictionary.filesystem')"
      :tabs="cloudEnvOptions"
      :current-tab.sync="cloudEnv" />
    <page-body>
      <file-system-list
        :id="listId"
        :cloud-env="cloudEnv"
        :cloudEnvOptions="cloudEnvOptions" />
    </page-body>
  </div>
</template>

<script>
import { getCloudEnvOptions2 } from '@/utils/common/hypervisor'
import FileSystemList from './components/List'

export default {
  name: 'FileSystem',
  components: {
    FileSystemList,
  },
  data () {
    return {
      listId: 'FileSystemList',
      cloudEnvOptions: getCloudEnvOptions2('compute_engine_brands', false, ['private']),
      cloudEnv: '',
    }
  },
}
</script>
