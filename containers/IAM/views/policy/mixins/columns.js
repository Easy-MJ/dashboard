import {
  getEnabledTableColumn,
  getProjectDomainTableColumn,
  getNameDescriptionTableColumn,
  getPublicScopeTableColumn,
  getTagTableColumn,
  getTimeTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        field: 'name',
        title: i18n.t('system.text_101'),
        minWidth: 100,
        edit: row => !row.is_system,
        editDesc: row => !row.is_system,
        hideField: true,
        formRules: [
          { required: true, message: i18n.t('system.text_168') },
        ],
        slotCallback: (row, h) => {
          return this.$createElement(
            'side-page-trigger',
            {
              on: {
                trigger: () => this.handleOpenSidepage(row),
              },
            },
            row.name,
          )
        },
      }),
      getEnabledTableColumn(),
      {
        field: 'scope',
        title: i18n.t('system.text_430', [i18n.t('dictionary.policy')]),
        width: 100,
        formatter: ({ row }) => {
          return this.$t(`policyScopeLabel.${row.scope}`)
        },
      },
      getTagTableColumn({
        customTitle: this.$t('iam.domain_tag'),
        title: this.$t('iam.domain_tag'),
        field: 'domain_tags',
        columns: () => this.columns,
      }),
      getTagTableColumn({
        customTitle: this.$t('iam.project_tag'),
        title: this.$t('iam.project_tag'),
        field: 'project_tags',
        columns: () => this.columns,
      }),
      getTagTableColumn({
        customTitle: this.$t('iam.object_tag'),
        title: this.$t('iam.object_tag'),
        field: 'object_tags',
        columns: () => this.columns,
      }),
      getPublicScopeTableColumn({ vm: this, resource: 'policies' }),
      getProjectDomainTableColumn(),
      getTimeTableColumn(),
    ]
  },
  methods: {
    isOwnerPublic (obj) {
      // fix by http://bug.yunion.io/zentao/bug-view-2958.html 共享的权限在其他域下时应该不能做任何操作
      if (obj.is_public) {
        if (this.isAdminMode) return true
        if (obj.domain_id !== this.userInfo.domain.id) return false
      }
      return true
    },
  },
}
