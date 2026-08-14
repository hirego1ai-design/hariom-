import { NextRequest, NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await agreementsDb.getTemplateById(id);
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await agreementsDb.updateTemplate(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Template updated successfully",
      template: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await req.json();

    if (action === "duplicate") {
      const duplicated = await agreementsDb.duplicateTemplate(id);
      if (!duplicated) {
        return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Template duplicated successfully",
        template: duplicated,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const archived = await agreementsDb.archiveTemplate(id);
    if (!archived) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: "Template archived successfully",
      template: archived,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
