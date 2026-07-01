package treasurypublish

// CIP-108 caps body.title at 80 characters. The bun anchor pipeline is the
// source of truth (schema-validated), but BuildGovAction guards it too since
// it's the step that submits the irreversible governance-action tx.
class AnchorTitleSuite extends munit.FunSuite {
    test("accepts a title at exactly 80 characters") {
        BuildGovActionTool.assertTitleLength("a" * 80)
    }

    test("rejects a title over 80 characters") {
        intercept[IllegalArgumentException] {
            BuildGovActionTool.assertTitleLength("a" * 84)
        }
    }
}
