<template>
  <div>
    <a-form
      class="mt-3"
      :form="form.fc"
      v-bind="formItemLayout">
      <a-form-item :label="$t('storage.text_55', [$t('dictionary.project')])" v-bind="formItemLayout">
        <domain-project :fc="form.fc" :decorators="{ project: decorators.project, domain: decorators.domain }" @update:domain="handleDomainChange" />
      </a-form-item>
      <a-form-item :label="$t('storage.text_40')">
        <a-input v-decorator="decorators.name" :placeholder="$t('network.text_44')" />
      </a-form-item>
      <a-form-item :label="$t('common.description')">
        <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-decorator="decorators.description" :placeholder="$t('common_367')" />
      </a-form-item>
      <area-selects
        class="mb-0"
        ref="areaSelects"
        :wrapperCol="formItemLayout.wrapperCol"
        :labelCol="formItemLayout.labelCol"
        :names="areaselectsName"
        :cloudregionParams="cloudregionParams"
        :isRequired="true"
        :cloudregionParamsMapper="cloudregionParamsMapper"
        :providerParams="providerParams"
        filterBrandResource="object_storage"
        @change="handleCloudregionChange" />
      <a-form-item :label="$t('compute.text_15')" required v-bind="formItemLayout">
        <base-select
          class="w-50"
          v-decorator="decorators.cloudprovider"
          resource="cloudproviders"
          :params="cloudproviderParams"
          :mapper="providerMapper"
          :isDefaultSelect="true"
          :showSync="true"
          :select-props="{ placeholder: $t('compute.text_149') }" />
      </a-form-item>
      <a-form-item :label="$t('storage.capacity')">
        <a-input-number v-decorator="decorators.capacity" /> GB
      </a-form-item>
      <a-form-item :label="$t('compute.text_1154')" class="mb-0">
        <tag
          v-decorator="decorators.tag" :allowNoValue="false" />
      </a-form-item>
    </a-form>
    <bottom-bar :values="form.fc.getFieldsValue()" :cloudAccountId="cloudAccountId" />
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import Tag from '@/sections/Tag'
import AreaSelects from '@/sections/AreaSelects'
import validateForm, { isRequired } from '@/utils/validate'
import i18n from '@/locales'
import DomainProject from '@/sections/DomainProject'
import { getCloudEnvOptions } from '@/utils/common/hypervisor'

function validateTag (rule, value, callback) {
  if (R.is(Object, value) && Object.keys(value).length > 20) {
    return callback(new Error(i18n.t('compute.text_209')))
  }
  callback()
}

export default {
  name: 'FileSystemIDCCreate',
  components: {
    AreaSelects,
    DomainProject,
    Tag,
  },
  data () {
    const cloudEnvOptions = getCloudEnvOptions('object_storage_brands', true)
    return {
      loading: false,
      cloudEnvOptions,
      routerQuery: this.$route.query.type,
      cloudEnv: this.$route.query.type ? this.$route.query.type : cloudEnvOptions[0].key,
      form: {
        fc: this.$form.createForm(this),
      },
      formItemLayout: {
        wrapperCol: {
          md: { span: 17 },
          xl: { span: 19 },
          xxl: { span: 21 },
        },
        labelCol: {
          md: { span: 7 },
          xl: { span: 5 },
          xxl: { span: 3 },
        },
      },
      project_domain: '',
      cloudregion: {},
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'scope', 'isAdminMode']),
    getFieldValue () {
      return this.form.fc.getFieldValue
    },
    decorators () {
      return {
        domain: [
          'domain',
          {
            rules: [
              { validator: isRequired(), message: i18n.t('rules.domain'), trigger: 'change' },
            ],
          },
        ],
        project: [
          'project',
          {
            rules: [
              { validator: isRequired(), message: i18n.t('rules.project'), trigger: 'change' },
            ],
          },
        ],
        name: [
          'name',
          {
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('network.text_218') },
              { validator: validateForm('serverName') },
            ],
          },
        ],
        description: ['description'],
        cloudprovider: [
          'cloudprovider',
          {
            rules: [
              { required: true, message: this.$t('network.text_689') },
            ],
          },
        ],
        capacity: [
          'capacity',
          {
            initialValue: 100
          }
        ],
        tag: [
          'tag',
          {
            rules: [
              { validator: validateTag },
            ],
          },
        ],
      }
    },
    cloudregionParams () {
      const params = {
        scope: this.scope,
      }
      params.cloud_env = this.cloudEnv
      if (this.isAdminMode) {
        params.project_domain = this.project_domain
        delete params.scope
      }
      return params
    },
    cloudproviderParams () {
      const params = {
        limit: 0,
        enabled: 1,
        details: true,
        scope: this.scope,
        read_only: false,
        cloudregion: this.cloudregion.id,
      }
      if (this.isAdminMode) {
        params.admin = true
        params.project_domain = this.project_domain
        delete params.scope
        delete params.domain_id
      }
      return params
    },
    areaselectsName () {
      return ['provider', 'cloudregion']
    },
    providerParams () {
      return {
        cloud_env: 'onpremise',
        scope: this.scope,
        projecct_domain: this.project_domain,
      }
    },
  },
  watch: {
    cloudEnv (newValue) {
      this.$refs.areaSelects.fetchs(this.areaselectsName)
    },
    project_domain () {
      this.$refs.areaSelects.fetchs(this.areaselectsName)
    },
  },
  provide () {
    return {
      form: this.form,
    }
  },
  methods: {
    handleDomainChange (val) {
      this.project_domain = val.key
    },
    providerMapper (data) {
      if (this.cloudEnv === 'onpremise') data = data.filter(item => item.provider !== 'VMware')
      return data
    },
    validateForm () {
      return new Promise((resolve, reject) => {
        this.form.fc.validateFields((err, values) => {
          if (err) return reject(err)
          const { zone, cloudregion } = values
          if (zone) {
            values.zone = zone.key
          }
          if (cloudregion) {
            values.cloudregion = cloudregion
          }
          resolve(values)
        })
      })
    },
    handleCloudregionChange (data) {
      const hasCloudRegion = R.has('cloudregion')(data)
      if (!hasCloudRegion || R.isEmpty(data.cloudregion)) return
      const cloudregion = data.cloudregion.value
      const name = this.form.fc.getFieldValue('name')
      this.cloudregion = cloudregion
      if (name) {
        this.form.fc.validateFields(['name'])
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        const values = await this.validateForm()
        const { project, domain, tag, ...rest } = values
        let meta = {}
        if (tag) {
          meta = tag
        }
        await new this.$Manager('file_systems').create({
          data: {
            ...rest,
            __meta__: meta,
            project_domain: (domain && domain.key) || this.userInfo.projectDomainId,
            project_id: (project && project.key) || this.userInfo.projectId,
          },
        })
        this.loading = false
        this.$message.success(this.$t('network.nat.create.success'))
        this.$router.push('/nas')
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    cloudregionParamsMapper (params) {
      const p = { ...params, capability: 'objectstore' }
      delete p.usable
      return p
    },
  },
}
</script>
