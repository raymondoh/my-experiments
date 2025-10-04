"use server";

export async function testAction(formData: FormData) {
  console.log("🧪 [TEST ACTION] Test action called!");
  console.log("🧪 [TEST ACTION] Form data:", Object.fromEntries(formData.entries()));
  return { message: "Test action works!" };
}
