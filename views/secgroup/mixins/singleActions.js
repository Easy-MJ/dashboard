import { mapGetters } from 'vuex'
import { getSetPublicAction } from '@/utils/common/tableActions'

export default {
  computed: {
    ...mapGetters(['isAdminMode', 'isDomainMode', 'isProjectMode', 'userInfo']),
  },
  created () {
    this.singleActions = [
      // {
      //   label: `关联${this.$t('dictionary.server')}`,
      //   permission: 'server_perform_assign_secgroup',
      //   action: (obj) => {
      //     this.createDialog('SetServerDialog', {
      //       data: [obj],
      //       columns: this.columns,
      //       title: `关联${this.$t('dictionary.server')}`,
      //       onManager: this.onManager,
      //       refresh: this.refresh,
      //     })
      //   },
      // },
      {
        label: '配置规则',
        action: (obj) => {
          this.sidePageTriggerHandle(this, 'SecGroupSidePage', {
            id: obj.id,
            resource: 'secgroups',
          }, { tab: 'in-direction' })
        },
      },
      {
        label: '更多',
        actions: obj => {
          return [
            // {
            //   label: '设置为私有',
            //   permission: 'secgroups_create',
            //   action: () => {
            //     this.onManager('performAction', {
            //       id: obj.id,
            //       managerArgs: {
            //         action: 'private',
            //       },
            //     })
            //   },
            //   meta: () => {
            //     if (this.$store.getters.isAdminMode || this.$store.getters.isDomainMode) {
            //       if (this.isPower(obj)) {
            //         return {
            //           validate: obj.is_public,
            //         }
            //       }
            //     }
            //     return {
            //       validate: false,
            //     }
            //   },
            // },
            // {
            //   label: '设置为共享',
            //   permission: 'secgroups_create',
            //   action: () => {
            //     this.createDialog('SetPublicDialog', {
            //       data: [obj],
            //       title: '设置为共享',
            //       columns: this.columns,
            //       onManager: this.onManager,
            //       refresh: this.refresh,
            //     })
            //   },
            //   meta: () => {
            //     if (this.$store.getters.isAdminMode || this.$store.getters.isDomainMode) {
            //       if (this.isPower(obj)) {
            //         return {
            //           validate: !obj.is_public,
            //         }
            //       }
            //     }
            //     return {
            //       validate: false,
            //     }
            //   },
            // },
            {
              label: '管理虚拟机',
              action: (obj) => {
                this.sidePageTriggerHandle(this, 'SecGroupSidePage', {
                  id: obj.id,
                  resource: 'secgroups',
                }, { tab: 'vminstance-list' })
              },
            },
            {
              label: '克隆',
              // permission: 'secgroups_create',
              action: () => {
                this.createDialog('CloneSecgroupDialog', {
                  data: [obj],
                  columns: this.columns,
                  title: '克隆',
                  onManager: this.onManager,
                  refresh: this.refresh,
                })
              },
              meta: () => {
                return {
                  validate: this.isPower(obj),
                }
              },
            },
            {
              label: '合并安全组',
              permission: 'secgroups_create',
              action: () => {
                this.createDialog('ConcatSecgroupDialog', {
                  data: [obj],
                  columns: this.columns,
                  title: '合并安全组',
                  onManager: this.onManager,
                  refresh: this.refresh,
                })
              },
              meta: () => {
                return {
                  validate: this.isPower(obj),
                }
              },
            },
            {
              label: `更改${this.$t('dictionary.project')}`,
              permission: 'secgroups_create',
              action: () => {
                this.createDialog('ChangeOwenrDialog', {
                  data: [obj],
                  columns: this.columns,
                  onManager: this.onManager,
                  refresh: this.refresh,
                  name: this.$t('dictionary.secgroup'),
                  resource: 'secgroups',
                })
              },
              meta: () => {
                if (!this.isProjectMode) {
                  return {
                    validate: this.isPower(obj),
                  }
                }
                return {
                  tooltip: `仅系统或${this.$t('dictionary.domain')}管理员支持该操作`,
                  validate: false,
                }
              },
            },
            getSetPublicAction(this, {
              name: this.$t('dictionary.secgroup'),
              scope: 'project',
              resource: 'secgroups',
            }, {
              permission: 'secgroups_performAction',
            }),
            {
              label: '删除',
              permission: 'secgroups_delete',
              action: () => {
                this.createDialog('DeleteResDialog', {
                  vm: this,
                  data: [obj],
                  columns: this.columns,
                  title: '删除',
                  name: this.$t('dictionary.secgroup'),
                  onManager: this.onManager,
                })
              },
              meta: () => {
                return {
                  validate: this.isPower(obj) && this.$getDeleteResult(obj).validate,
                  tooltip: !this.$getDeleteResult(obj).validate ? this.$getDeleteResult(obj).tooltip : '',
                }
              },
            },
          ]
        },
      },
    ]
  },
  methods: {
    isPower (obj) {
      if (this.isAdminMode) return true
      if (this.isDomainMode) return obj.domain_id === this.userInfo.projectDomainId
      return obj.tenant_id === this.userInfo.projectId
    },
  },
}
