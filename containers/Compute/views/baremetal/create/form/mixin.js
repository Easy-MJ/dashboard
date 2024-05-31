import { mapGetters } from 'vuex'
import _ from 'lodash'
import * as R from 'ramda'
import i18n from '@/locales'
import { LOGIN_TYPES_MAP, NETWORK_OPTIONS_MAP, FORECAST_FILTERS_MAP } from '@Compute/constants'
import validateForm, { isRequired, isWithinRange } from '@/utils/validate'
import { sizestr } from '@/utils/utils'
import { WORKFLOW_TYPES } from '@/constants/workflow'
import OsSelect from '@Compute/sections/OsSelect'
import ServerPassword from '@Compute/sections/ServerPassword'
import ServerNetwork from '@Compute/sections/ServerNetwork'
import SchedPolicy from '@Compute/sections/SchedPolicy'
import DomainProject from '@/sections/DomainProject'
import CloudregionZone from '@/sections/CloudregionZone'
import Tag from '@/sections/Tag'
import workflowMixin from '@/mixins/workflow'
import WindowsMixin from '@/mixins/windows'
import BottomBar from '../components/BottomBar'

function checkIpInSegment (i, networkData) {
  return (rule, value, cb) => {
    const isIn = isWithinRange(value, networkData.guest_ip_start, networkData.guest_ip_end)
    if (isIn) {
      cb()
    } else {
      cb(new Error(i18n.t('compute.text_205')))
    }
  }
}

export default {
  components: {
    BottomBar,
    CloudregionZone,
    OsSelect,
    ServerPassword,
    ServerNetwork,
    SchedPolicy,
    DomainProject,
    Tag,
  },
  mixins: [WindowsMixin, workflowMixin],
  provide () {
    return {
      form: this.form,
      fd: this.form.fd,
      fi: this.form.fi,
    }
  },
  props: {
    type: {
      type: String,
      required: true,
      validator: val => ['idc', 'private'].includes(val),
    },
  },
  data () {
    return {
      submiting: false,
      errors: {},
      formItemLayout: {
        wrapperCol: {
          md: { span: 18 },
          xl: { span: 20 },
          xxl: { span: 22 },
        },
        labelCol: {
          md: { span: 6 },
          xl: { span: 4 },
          xxl: { span: 2 },
        },
      },
      offsetFormItemLayout: {
        wrapperCol: {
          md: { span: 18, offset: 6 },
          xl: { span: 20, offset: 4 },
          xxl: { span: 22, offset: 2 },
        },
      },
      form: {
        fc: this.$form.createForm(this, {
          onValuesChange: (props, values) => {
            Object.keys(values).forEach((key) => {
              this.$set(this.form.fd, key, values[key])
            })
            this.$bus.$emit('updateForm', values)
            if (values.hasOwnProperty('cloudregion') && values.cloudregion.key) {
              this.cloudregion = values.cloudregion.key
            }
            if (values.hasOwnProperty('zone') && values.zone.key) {
              this.capability(values.zone.key)
              this.zone = values.zone.key
            }
            if (values.hasOwnProperty('imageType')) {
              if (values.imageType === 'iso') {
                this.capability(this.zone, true)
              } else {
                this.capability(this.zone)
              }
            }
            if (values.domain) {
              this.project_domain = values.domain.key
              this.params.region = {
                ...this.params.region,
                project_domain: values.domain.key,
              }
            }
          },
        }),
        fd: {},
        fi: {
          capability: {},
          imageMsg: {},
          createType: 'baremetal',
        },
      },
      commonDecorators: {
        domain: [
          'domain',
          {
            initialValue: this.$route.query.domain_id || '',
            rules: [
              { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
            ],
          },
        ],
        project: [
          'project',
          {
            rules: [
              { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
            ],
          },
        ],
        name: [
          'name',
          {
            initialValue: '',
            validateTrigger: 'blur',
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('compute.text_210') },
              { validator: this.$validate('resourceCreateName') },
            ],
          },
        ],
        regionZone: {
          cloudregion: [
            'cloudregion',
            {
              initialValue: { key: '', label: '' },
              rules: [
                { required: true, message: this.$t('compute.text_212') },
              ],
            },
          ],
          zone: [
            'zone',
            {
              initialValue: { key: '', label: '' },
              rules: [
                { required: true, message: this.$t('compute.text_213') },
              ],
            },
          ],
        },
        count: [
          'count',
          {
            initialValue: 1,
          },
        ],
        specifications: [
          'specifications',
          {
            rules: [
              { required: true, message: this.$t('compute.text_313') },
            ],
          },
        ],
        loginConfig: {
          loginType: [
            'loginType',
            {
              initialValue: 'random',
            },
          ],
          keypair: [
            'loginKeypair',
            {
              rules: [
                { required: true, message: this.$t('compute.text_203') },
              ],
            },
          ],
          password: [
            'loginPassword',
            {
              initialValue: '',
              validateFirst: true,
              rules: [
                { required: true, message: this.$t('compute.text_204') },
                { validator: validateForm('sshPassword') },
              ],
            },
          ],
        },
        network: {
          networkType: [
            'networkType',
            {
              initialValue: NETWORK_OPTIONS_MAP.default.key,
            },
          ],
          networkConfig: {
            vpcs: i => [
              `vpcs[${i}]`,
              {
                validateTrigger: ['change', 'blur'],
                rules: [{
                  required: true,
                  message: this.$t('compute.text_194'),
                }],
              },
            ],
            networks: i => [
              `networks[${i}]`,
              {
                validateTrigger: ['change', 'blur'],
                rules: [{
                  required: true,
                  message: this.$t('compute.text_217'),
                }],
              },
            ],
            ips: (i, networkData) => [
              `networkIps[${i}]`,
              {
                validateFirst: true,
                validateTrigger: ['blur', 'change'],
                rules: [{
                  required: true,
                  message: this.$t('compute.text_218'),
                }, {
                  validator: checkIpInSegment(i, networkData),
                }],
              },
            ],
          },
          networkSchedtag: {
            schedtags: i => [
              `networkSchedtags[${i}]`,
              {
                validateTrigger: ['change', 'blur'],
                rules: [{
                  required: true,
                  message: this.$t('compute.text_123'),
                }],
              },
            ],
            policys: (i, networkData) => [
              `networkPolicys[${i}]`,
              {
                validateTrigger: ['blur', 'change'],
                rules: [{
                  required: true,
                  message: this.$t('compute.text_123'),
                }],
              },
            ],
          },
        },
        schedPolicy: {
          schedPolicyType: [
            'schedPolicyType',
            {
              initialValue: 'default',
            },
          ],
          schedPolicyHost: [
            'schedPolicyHost',
            {
              rules: [
                { required: true, message: this.$t('compute.text_314') },
              ],
            },
          ],
          policySchedtag: {
            schedtags: i => [
              `policySchedtagSchedtags[${i}]`,
              {
                validateTrigger: ['change', 'blur'],
                rules: [{
                  required: true,
                  message: this.$t('compute.text_123'),
                }],
              },
            ],
            policys: (i, networkData) => [
              `policySchedtagPolicys[${i}]`,
              {
                validateTrigger: ['blur', 'change'],
                rules: [{
                  required: true,
                  message: this.$t('compute.text_123'),
                }],
              },
            ],
          },
        },
        description: [
          'description',
        ],
        __meta__: [
          '__meta__',
          {
            rules: [
              { validator: validateForm('tagName') },
            ],
          },
        ],
      },
      zone: '',
      cloudregion: '',
      params: {
        zone: {},
        region: {
          usable: true,
          cloud_env: this.type === 'idc' ? 'onpremise' : this.type,
          scope: this.$store.getters.scope,
        },
        policySchedtag: {
          limit: 1024,
          'filter.0': 'resource_type.equals(hosts)',
          scope: this.$store.getters.scope,
        },
        policyHostParams: {
          enabled: 1,
          usable: true,
          is_empty: true,
          host_type: 'baremetal',
          scope: this.$store.getters.scope,
        },
        vpcParams: {
          usable: true,
          scope: this.$store.getters.scope,
          // limit: 0,
          // show_emulated: true,
        },
      },
      selectedImage: {},
      specOptions: [],
      selectedSpecItem: {},
      resourceType: 'shared',
      policyHostDisabled: [],
      diskData: {},
      diskOptionsDate: [],
      chartSettings: {
        limitShowNum: 5,
        radius: 50,
        selectedMode: 'single',
        labelLine: {
          normal: {
            show: true,
          },
        },
        label: {
          position: 'inside',
        },
        itemStyle: {
          color: function (params) {
            const colorList = ['#afa3f5', '#00d488', '#3feed4', '#3bafff', '#f1bb4c', 'rgba(250,250,250,0.5)']
            if (params.data.name === i18n.t('compute.text_315')) {
              return '#e3e3e3'
            } else {
              return colorList[params.dataIndex]
            }
          },
        },
        offsetY: 100,
        dataType: function (v) {
          return v + ' G'
        },
      },
      isBonding: false,
      isShowFalseIcon: false,
      count: 1,
      hostData: [],
      filterHostData: [],
      isSupportIso: false,
      project_domain: '',
      projectId: '',
      osSelectImageType: 'standard',
      wires: [],
    }
  },
  computed: {
    ...mapGetters([
      'isAdminMode',
      'scope',
      'isDomainMode',
      'userInfo',
    ]),
    routerQuery () {
      return this.$route.query
    },
    imageParams () {
      return {
        status: 'active',
        details: true,
        limit: 0,
        'filter.0': 'disk_format.notequals(iso)',
        scope: this.scope,
        is_standard: true,
      }
    },
    isInstallOperationSystem () { // 是否是安装操作系统
      if (this.$route.query.host_id) {
        return true
      }
      return false
    },
    networkParam () {
      let ret = {
        zone: this.zone,
        usable: true,
      }
      if (this.isInstallOperationSystem) {
        if (this.$route.query.wire_id) ret.filter = `wire_id.in(${this.$route.query.wire_id})`
        ret = {
          ...ret,
          scope: this.scope,
          host: this.$route.query.host_id,
        }
        return ret
      } else {
        ret = {
          ...ret,
          ...this.scopeParams,
        }
      }
      if (!R.isEmpty(this.wires)) {
        ret.filter = `wire_id.in(${this.wires.join(',')})`
      }
      return ret
    },
    vpcResource () {
      if (this.isInstallOperationSystem) {
        return 'vpcs'
      }
      return `cloudregions/${this.cloudregion}/vpcs`
    },
    scopeParams () {
      if (this.isDomainMode) {
        return {
          scope: this.scope,
        }
      }
      return { project_domain: this.project_domain || this.projectId }
    },
    hasMeterService () { // 是否有计费的服务
      const { services } = this.userInfo
      const meterService = services.find(val => val.type === 'meter')
      if (meterService && meterService.status === true) {
        return true
      }
      return false
    },
    osSelectTypes () {
      const types = ['standard', 'customize']
      if (this.isInstallOperationSystem && this.isSupportIso) {
        types.push('iso')
      }
      if (!this.isInstallOperationSystem) {
        types.push('iso')
      }
      if (this.type === 'private') {
        types.unshift('private')
      }
      return types
    },
    isOpenWorkflow () {
      return this.checkWorkflowEnabled(WORKFLOW_TYPES.APPLY_MACHINE)
    },
    isCheckedIso () {
      return this.osSelectImageType === 'iso'
    },
    isWindows () {
      let isWindows = false
      if (this.selectedImage.os && this.form.fd.os.toLowerCase() === 'windows') {
        isWindows = true
      }
      return isWindows
    },
    loginTypes () { // 主机模板隐藏手工输入密码
      const maps = R.clone(LOGIN_TYPES_MAP)
      if (this.isWindows) {
        delete maps.keypair
      }
      const loginTypes = Object.keys(maps)
      return loginTypes
    },
  },
  watch: {
    diskOptionsDate: {
      handler (val) {
        let isDistribution = false
        let isDiff = false // 是否存在不通的raid盘
        for (var i = 0; i < this.diskOptionsDate.length; i++) {
          // 每一项是否有分配磁盘
          if (i > 0) {
            const rowsLength = this.diskOptionsDate[i].chartData.rows.length
            if ((rowsLength === 1 && this.diskOptionsDate[i].chartData.rows[0].name !== this.$t('compute.text_315')) || (rowsLength > 1)) {
              isDistribution = true
            }
          }
          if (this.diskOptionsDate[0].diskInfo[1] !== this.diskOptionsDate[i].diskInfo[1]) {
            isDiff = true
          }
          if (isDiff && this.diskOptionsDate[0].remainder > 0 && isDistribution) {
            this.isShowFalseIcon = true
          } else {
            this.isShowFalseIcon = false
          }
        }
      },
      deep: true,
    },
    project_domain (newVal, oldVal) {
      if (this.isInstallOperationSystem) this.fetchSpec()
      this.capability(this.zone)
    },
  },
  created () {
    this.zonesM2 = new this.$Manager('zones')
    this.serverM = new this.$Manager('servers')
    this.schedulerM = new this.$Manager('schedulers', 'v1')
    this.fetchSpec = _.debounce(this._fetchSpec, 500)
    if (this.$route.query.id) {
      this.fetchSpec()
      this.hostDetail()
    }
    if (this.$route.query.zone_id) {
      this.zone = this.$route.query.zone_id
      this.capability(this.$route.query.zone_id)
    }
    if (this.scope !== 'project') {
      this.loadHostOpt()
    }
  },

  methods: {
    setSelectedImage ({ imageMsg }) {
      this.selectedImage = imageMsg
    },
    // 过滤network数据
    networkResourceMapper (data) {
      data = data.filter((d) => d.server_type !== 'ipmi' && d.server_type !== 'pxe')
      return data
    },
    // 指定物理机改变
    hostChange (e) {
      this.hostDetail(e)
    },
    // 规格变动
    specificationChange (value) {
      const str = value.replace(/\//g, ',')
      const arr = str.split(',')
      const obj = {}
      for (var i = 0; i < arr.length; i++) {
        const arr2 = arr[i].split(':')
        obj[arr2[0]] = arr2[1]
      }
      this.selectedSpecItem = obj
      const currentSpec = this.form.fi.capability.specs.hosts[value]
      if (R.has('isolated_devices')(currentSpec)) {
        this.selectedSpecItem.isolated_devices = currentSpec.isolated_devices
      }
      this.diskData = this.form.fi.capability.specs.hosts[value].disk
      // 过滤包含此规格的物理机
      this.hostResourceMapper(this.hostData)
      // 获取此规格的包含的wire
      this.getSpecWire(value)
      // 规格变动清空历史硬盘配置
      this.diskOptionsDate = []
    },
    // 获取物理机数据
    loadHostOpt () {
      const manager = new this.$Manager('hosts')
      const params = { ...this.params.policyHostParams }
      manager.list({ params })
        .then(({ data: { data = [] } }) => {
          this.hostData = data
          this.filterHostData = data
        })
        .catch((error) => {
          throw error
        })
    },
    // 如果是安装操作系统--查询物理机详情
    hostDetail (hostId) {
      const hostManager = new this.$Manager('hosts')
      hostManager.get({ id: this.$route.query.id || hostId })
        .then(({ data }) => {
          if (data.ipmi_info && data.ipmi_info.cdrom_boot) {
            this.isSupportIso = true
          } else {
            this.isSupportIso = false
          }
        })
    },
    // 如果有指定物理机的情况下过滤物理机数据
    hostResourceMapper (data) {
      this.filterHostData = data.filter((d) => R.equals(d.spec.disk, this.diskData))
    },
    // 安装操作系统下获取规格
    _fetchSpec () {
      const manager = new this.$Manager('specs')
      const params = { host_type: 'baremetal', filter: `id.equals(${this.$route.query.id})`, ...this.scopeParams }
      manager.rpc({ methodname: 'GetHostSpecs', params }).then(res => {
        const specs = res.data
        this.$set(this.form.fi.capability, 'specs', {
          hosts: specs,
        })
        if (!R.isNil(specs) && !R.isEmpty(specs)) {
          this._loadSpecificationOptions(specs)
        } else {
          this.specOptions = []
          // 清空选中规格
          this.$nextTick(() => {
            this.form.fc.setFieldsValue({ specifications: '' })
          })
        }
      })
    },
    capability (v, isIso = false) { // 可用区查询
      const data = {
        show_emulated: true,
        resource_type: this.resourceType,
        host_type: 'baremetal',
        ...this.scopeParams,
      }
      if (isIso) {
        data.cdrom_boot = true
      }
      if (!v) return
      // init 虚拟化平台并默认选择第一项
      this.zonesM2.get({
        id: `${v}/capability`,
        params: data,
      }).then(({ data = {} }) => {
        data.hypervisors = Array.from(new Set(data.hypervisors))
        const specs = data.specs.hosts
        // 如果是安装操作系统，只需要拿取public_network_count
        if (this.isInstallOperationSystem) {
          this.form.fi.capability = {
            ...this.form.fi.capability,
            public_network_count: data.public_network_count,
            auto_alloc_network_count: data.auto_alloc_network_count,
          }
        } else {
          this.form.fi.capability = {
            ...data,
          }
          if (!R.isNil(specs) && !R.isEmpty(specs)) {
            this._loadSpecificationOptions(specs)
          } else {
            this.specOptions = []
            // 清空选中规格
            this.$nextTick(() => {
              this.form.fc.setFieldsValue({ specifications: '' })
            })
          }
        }
      })
    },
    _loadSpecificationOptions (data) {
      const specs = {}
      let entries = Object.entries(data)
      entries = entries.map(item => {
        const newKey = item[0].replace(/model:.+\//, '')
        return [newKey, item[1]]
      })
      entries.forEach(item => {
        specs[item[0]] = item[1]
      })
      const options = []
      for (const k in specs) {
        const spec = {
          text: this.__getSpecification(specs[k]),
          value: k,
        }
        options.push(spec)
      }
      this.form.fi.capability.specs.hosts = specs
      this.specOptions = this.__ignoreModel(options)
      if (this.specOptions && this.specOptions.length) {
        // 规格默认选中第一项
        this.$nextTick(() => {
          this.form.fc.setFieldsValue({ specifications: this.specOptions[0].value })
        })
        // 存储选中规格中的信息
        this.diskData = this.form.fi.capability.specs.hosts[this.specOptions[0].value].disk
        this.hostResourceMapper(this.hostData)
        // 根据规格读取wire数据
        this.getSpecWire(this.specOptions[0].value)
        const originalValue = this.specOptions[0].value
        const str = this.specOptions[0].value.replace(/\//g, ',')
        const arr = str.split(',')
        const obj = {}
        for (var i = 0; i < arr.length; i++) {
          const arr2 = arr[i].split(':')
          obj[arr2[0]] = arr2[1]
        }
        obj.value = originalValue
        this.selectedSpecItem = obj
        const currentSpec = this.form.fi.capability.specs.hosts[originalValue]
        if (R.has('isolated_devices')(currentSpec)) {
          this.selectedSpecItem.isolated_devices = currentSpec.isolated_devices
        }
      }
    },
    __getSpecification (spec) {
      const cpu = spec.cpu
      const mem = sizestr(spec.mem, 'M', 1024)
      // 按类型和容量归并磁盘信息
      const disksObj = {}
      _.forEach(spec.disk, function (adapters, driver) {
        _.forEach(adapters, function (disks, adapter) {
          _.forEach(disks, function (disk) {
            disksObj[disk.type] = disksObj[disk.type] || {}
            disksObj[disk.type][disk.size] = disksObj[disk.type][disk.size] || 0
            disksObj[disk.type][disk.size] += disk.count
          })
        })
      })
      // disk string
      let disks = ''
      _.forEach(disksObj, function (caps, d) {
        disks += '_' + d
        const sizes = []
        _.forEach(caps, function (num, cap) {
          sizes.push(sizestr(cap, 'M', 1024) + 'x' + num)
        })
        disks += sizes.join('_')
      })
      // isolated_devices 根据 model 去重并添加count字段
      if (spec.isolated_devices && spec.isolated_devices.length > 0) {
        const gpuList = R.clone(spec.isolated_devices)
        for (let i = 0; i < gpuList.length; i++) {
          gpuList[i].count = 1
          for (let j = i + 1; j < gpuList.length; j++) {
            if (gpuList[i].model === gpuList[j].model) {
              gpuList[i].count++
              gpuList.splice(j, 1)
            }
          }
        }
        // gpu string
        let gpuString = '_'
        gpuList.map(item => {
          gpuString += `${item.model}X${item.count}、`
        })
        gpuString = gpuString.substr(0, gpuString.length - 1)
        return `${cpu}C${mem}${disks}${gpuString}`
      }
      return `${cpu}C${mem}${disks}`
    },
    __ignoreModel (options) {
      options = options.map(item => {
        return {
          text: item.text,
          value: item.value.replace(/model:.+\//, ''),
        }
      })
      return this.uniqueArr(options, 'value')
    },
    uniqueArr (arr, field) {
      if (field) {
        const obj = {}
        arr.forEach(item => {
          if (!obj[item[field]]) {
            obj[item[field]] = item
          }
        })
        const newArr = Object.values(obj)
        return Array.from(new Set(newArr))
      } else {
        return Array.from(new Set(arr))
      }
    },
    // 添加硬盘配置
    addDisk () {
      this.createDialog('BaremetalCreateDiskDialog', {
        title: this.$t('compute.perform_create'),
        list: this.list,
        diskData: this.diskData,
        diskOptionsDate: this.diskOptionsDate,
        updateData: (data) => {
          this.addDiskCallBack(data)
        },
      })
    },
    _isNoneRaid (raidOpt) {
      return raidOpt === 'none'
    },
    // 添加硬盘配置后的回调
    addDiskCallBack (data) {
      let arr = []
      // data.option format: `["HPSARaid:adapter0", "HDD:279G", "raid10"]`
      data.option.forEach(item => {
        arr = arr.concat(item.split(':'))
      })
      // arr format: `["HPSARaid", "adapter0", "HDD", "279G", "raid10"]`
      const raidOpt = data.option[2]
      const raidType = arr[0]
      const adapter = arr[1]
      const diskType = arr[2]
      const diskSize = arr[3]

      let range = []
      let k = data.start_index
      if (this._isNoneRaid(raidOpt)) {
        range = [data.start_index]
      } else {
        while (k < data.start_index + data.count) {
          range.push(k)
          k++
        }
      }

      let sizeNumber = 0
      let n = 0
      if (diskSize.substr(diskSize.length - 1, 1) === 'T') {
        n = Number(diskSize.substr(0, diskSize.length - 1)) * 1024
      } else {
        n = Number(diskSize.substr(0, diskSize.length - 1))
      }
      if (this._isNoneRaid(raidOpt)) {
        sizeNumber = n
      } else {
        sizeNumber = this.raidUtil(n, raidOpt, data.count)
      }
      const option = {
        title: diskSize + ' ' + diskType + ' X ' + `${raidOpt === 'none' ? 1 : data.count}`,
        size: sizestr(sizeNumber, 'G', 1024),
        unitSize: sizestr(n, 'G', 1024),
        chartData: {
          columns: ['name', 'size'],
          rows: [],
        },
        diskInfo: [raidType, adapter, raidOpt],
        count: this._isNoneRaid(raidOpt) ? 1 : data.count,
        type: diskType,
        range,
      }
      if (this.diskOptionsDate.length === 0) {
        const defaultSize = 30
        const imageDiskSize = this.selectedImage.min_disk / 1024
        if (imageDiskSize >= defaultSize) {
          sizeNumber = sizeNumber - imageDiskSize
          option.chartData.rows.push({ name: this.$t('compute.text_316'), size: imageDiskSize })
        } else {
          sizeNumber = sizeNumber - defaultSize
          option.chartData.rows.push({ name: '/', size: defaultSize })
        }
      }
      option.remainder = sizeNumber
      option.chartData.rows.push({ name: this.$t('compute.text_315'), size: sizeNumber })
      this.diskOptionsDate.push(option)
      data.computeCount--
      if (this._isNoneRaid(raidOpt) && data.computeCount > 0) {
        data.start_index += 1
        this.addDiskCallBack(data)
      }
    },
    handleDiskItemRemove (idx) {
      this.diskOptionsDate.splice(idx, 1)
    },
    chartFun (idx) {
      return {
        click: (e, index) => this.handleChartEvents(e, idx),
      }
    },
    handleChartEvents (e, idx) {
      const selectedArea = this.diskOptionsDate[idx].chartData.rows.filter(item => item.name === e.name)
      let nameArr = []
      this.diskOptionsDate.forEach(item => {
        nameArr = nameArr.concat(item.chartData.rows)
      })
      nameArr = nameArr.filter(item => item.name !== this.$t('compute.text_315'))
      this.createDialog('DiskOptionsUpdateDialog', {
        title: e.name === this.$t('compute.text_315') ? this.$t('compute.text_317') : this.$t('compute.text_318'),
        list: this.list,
        item: this.diskOptionsDate[idx],
        nameArr,
        selectedArea: selectedArea[0],
        updateData: (values) => {
          const updateItem = this.diskOptionsDate[idx].chartData.rows
          if (e.name === this.$t('compute.text_315')) {
            // 创建新分区
            updateItem.unshift({ name: values.name, size: values.size, format: values.format })
            if (values.size === this.diskOptionsDate[idx].remainder || values.method === 'autoextend') {
              this.diskOptionsDate[idx].remainder = 0
              updateItem.pop()
              return
            }
            this.diskOptionsDate[idx].remainder = this.diskOptionsDate[idx].remainder - values.size
            updateItem[updateItem.length - 1].size = updateItem[updateItem.length - 1].size - values.size
          } else {
            // 更新分区
            let oldSize = 0
            updateItem.forEach(item => {
              if (item.name === e.name) {
                item.name = values.name
                oldSize = item.size
                item.size = values.size
              }
            })
            // 如何剩余比更新的大
            if (this.diskOptionsDate[idx].remainder > values.size) {
              updateItem[updateItem.length - 1].size = updateItem[updateItem.length - 1].size + oldSize - values.size
              this.diskOptionsDate[idx].remainder = this.diskOptionsDate[idx].remainder + oldSize - values.size
              if (updateItem[updateItem.length - 1].name === this.$t('compute.text_315')) {
                updateItem[updateItem.length - 1].size = this.diskOptionsDate[idx].remainder
              } else {
                updateItem.push({ name: this.$t('compute.text_315'), size: this.diskOptionsDate[idx].remainder })
              }
            } else {
              if (values.method === 'autoextend') {
                this.diskOptionsDate[idx].remainder = 0
                updateItem.pop()
                return
              }
              this.diskOptionsDate[idx].remainder = (oldSize - values.size) + this.diskOptionsDate[idx].remainder
              if (this.diskOptionsDate[idx].remainder === 0) return
              if (updateItem[updateItem.length - 1].name === this.$t('compute.text_315')) {
                updateItem[updateItem.length - 1].size = this.diskOptionsDate[idx].remainder
              } else {
                updateItem.push({ name: this.$t('compute.text_315'), size: this.diskOptionsDate[idx].remainder })
              }
            }
          }
        },
      })
    },
    validateForm () {
      return new Promise((resolve, reject) => {
        this.form.fc.validateFields((err, values) => {
          if (!err) {
            resolve(values)
          } else {
            reject(err)
          }
        })
      })
    },
    // raid计算大小公式
    raidUtil (n, raid, m) {
      let size = 0
      switch (raid) {
        case 'raid0':
          size = n * m
          break
        case 'raid1':
          size = n * m / m
          break
        case 'raid5':
          size = n * (m - 1)
          break
        case 'raid10':
          size = n * m / 2
          break
      }
      return size
    },
    async handleConfirm (e) {
      e.preventDefault()
      const diskConfigs = []
      const values = await this.validateForm()
      const disks = []
      const nets = []
      // 判断数据盘是否合法
      if (this.diskOptionsDate.length > 0) {
        if (this.isShowFalseIcon) {
          this.$message.error(this.$t('compute.text_319'))
          throw new Error(this.$t('compute.text_319'))
        }
        // 将系统盘放置首位
        const systemDisk = this.diskOptionsDate[0].chartData.rows.pop()
        this.diskOptionsDate[0].chartData.rows.unshift(systemDisk)
        for (var i = 0; i < this.diskOptionsDate.length; i++) {
          const rows = this.diskOptionsDate[i].chartData.rows
          const adapter = Number(this.diskOptionsDate[i].diskInfo[1].charAt(this.diskOptionsDate[i].diskInfo[1].length - 1))
          const configOption = {
            conf: this.diskOptionsDate[i].diskInfo[2],
            driver: this.diskOptionsDate[i].diskInfo[0],
            count: this.diskOptionsDate[i].count,
            range: this.diskOptionsDate[i].range,
            adapter,
            type: this.diskOptionsDate[i].type === 'HDD' ? 'rotate' : 'ssd',
          }
          diskConfigs.push(configOption)
          for (var j = 0; j < rows.length; j++) {
            let option = {
              size: rows[j].size * 1024,
              fs: rows[j].format,
              mountpoint: rows[j].name,
            }
            if (i === 0 && j === 0) {
              // 判断是否是iso导入
              if (values.imageType === 'iso') {
                option = {
                  size: rows[j].size * 1024,
                }
              } else {
                option = {
                  size: rows[j].size * 1024,
                  image_id: values.image.key,
                }
              }
            }
            if (j === rows.length - 1) {
              option.size = -1
              if (!rows[j].format) {
                Reflect.deleteProperty(option, 'fs')
              }
              if (rows[j].name === this.$t('compute.text_315')) {
                Reflect.deleteProperty(option, 'mountpoint')
              }
            }
            disks.push(option)
          }
        }
        // 根据adapter排序diskConfigs
        diskConfigs.sort((a, b) => { return a.adapter - b.adapter })
      }
      if (values.networks) {
        const networks = values.networks
        for (const key in networks) {
          const option = {
            network: networks[key],
          }
          if (!R.isNil(values.networkIps) && !R.isEmpty(values.networkIps)) {
            option.address = values.networkIps[key]
          }
          // 是否启用bonding
          if (this.isBonding) {
            option.require_teaming = true
            if (this.isInstallOperationSystem) option.private = false
            nets.push(option)
          } else {
            nets.push(option)
          }
        }
      } else {
        // 是否启用bonding
        if (this.isBonding) {
          nets.push({ exit: false, require_teaming: true })
        } else {
          nets.push({ exit: false })
        }
      }
      // 判断是否是安装操作系统
      let params = {
        project_id: this.projectId.key,
        count: values.count,
        vmem_size: Number(this.selectedSpecItem.mem.substr(0, this.selectedSpecItem.mem.length - 1)),
        vcpu_count: Number(this.selectedSpecItem.cpu),
        generate_name: values.name,
        hypervisor: 'baremetal',
        auto_start: true,
        vdi: 'vnc',
        disks,
        baremetal_disk_configs: diskConfigs,
        nets,
        prefer_host: this.isInstallOperationSystem ? this.$route.query.id : values.schedPolicyHost,
        description: values.description,
        prefer_region: values.cloudregion ? values.cloudregion.key : this.$route.query.region_id,
        prefer_zone: values.zone ? values.zone.key : this.$route.query.zone_id,
        __meta__: values.__meta__,
      }
      if (values.loginPassword) params.password = values.loginPassword
      if (values.loginKeypair) params.keypair = values.loginKeypair.key
      if (this.selectedSpecItem.isolated_devices) params.isolated_devices = this.selectedSpecItem.isolated_devices
      // 判断是否是iso导入
      if (values.imageType === 'iso') {
        params = {
          ...params,
          cdrom: values.image.key,
        }
      }
      if (this.isInstallOperationSystem) {
        // Reflect.deleteProperty(params, 'project_id')
        this.createBaremetal(params)
      } else {
        if (this.isOpenWorkflow) { // 提交工单
          const variables = {
            process_definition_key: WORKFLOW_TYPES.APPLY_MACHINE,
            initiator: this.userInfo.id,
            'server-create-paramter': JSON.stringify(params),
          }
          this.doCreateWorkflow(variables, params)
        } else { // 创建裸金属
          this.doForecast(params)
        }
      }
    },
    // 创建工单
    doCreateWorkflow (variables, params) {
      this.submiting = true
      new this.$Manager('process-instances', 'v1')
        .create({ data: { variables } })
        .then(() => {
          this.submiting = false
          this.$message.success(this.$t('compute.text_320', [params.name]))
          this.$router.push('/workflow')
        })
        .catch(() => {
          this.submiting = false
        })
    },
    doForecast (params) {
      this.submiting = true
      this.schedulerM.rpc({ methodname: 'DoForecast', params })
        .then(res => {
          if (res.data.can_create) {
            this.createBaremetal(params)
          } else {
            this.errors = this.getForecastErrors(res.data)
            this.submiting = false
          }
        })
        .catch(err => {
          this.$message.error(this.$t('compute.text_321', [err]))
          this.submiting = false
        })
    },
    // 创建裸金属
    createBaremetal (data) {
      const { count } = data
      if (count > 1) {
        this.serverM.batchCreate({ data, count })
          .then(res => {
            this.submiting = false
            this.$message.success(this.$t('compute.text_322'))
            if (this.isInstallOperationSystem) {
              this.$router.push('/physicalmachine')
            } else {
              this.$router.push('/baremetal')
            }
          })
          .catch(() => {
            this.submiting = false
          })
      } else {
        this.serverM.create({ data })
          .then(res => {
            this.submiting = false
            this.$message.success(this.$t('compute.text_322'))
            if (this.isInstallOperationSystem) {
              this.$router.push('/physicalmachine')
            } else {
              this.$router.push('/baremetal')
            }
          })
          .catch(() => {
            this.submiting = false
          })
      }
    },
    getForecastErrors (data) {
      const errors = []
      if (data.filtered_candidates && data.filtered_candidates.length > 0) {
        for (let i = 0, len = data.filtered_candidates.length; i < len; i++) {
          const item = data.filtered_candidates[i]
          let message = `${this.$t('dictionary.physicalmachine')}【${item.name}】`
          const filterMapItem = FORECAST_FILTERS_MAP[item.filter_name]
          if (filterMapItem) {
            message += filterMapItem
          } else {
            message += this.$t('compute.text_1325', [item.filter_name])
          }
          errors.push({
            message,
            children: item.reasons,
          })
        }
      } else {
        errors.push({
          message: this.$t('compute.text_227'),
        })
      }
      return {
        errors,
        allow_count: data.allow_count,
        req_count: data.req_count,
        not_allow_reasons: data.not_allow_reasons,
      }
    },
    getSpecWire (currentSpec) {
      const manager = new this.$Manager('specs')
      const params = { host_type: 'baremetal', kind: 'hosts', key: currentSpec, ...this.scopeParams }
      manager.rpc({ methodname: 'GetObjects', params }).then(res => {
        const hosts = res.data || []
        this.wires = []
        for (const host of hosts) {
          let nicInfos = host.nic_info || []
          nicInfos = nicInfos.filter(item => !['ipmi', 'pxe'].includes(item.nic_type) && item.wire_id)
          const wireIds = nicInfos.map(item => item.wire_id)
          const newWireIds = Array.from(new Set(wireIds))
          this.wires = newWireIds
        }
      })
    },
  },
}
